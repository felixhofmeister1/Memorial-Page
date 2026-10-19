'use server';

import { refresh } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import { ForbiddenError, requireStaff } from '@/lib/auth';
import { NPH_COUNTRIES } from '@/lib/countries';
import { env } from '@/lib/env';
import { deleteImage, hasFile, imageStorage, processImage, publishUpload, storeImage } from '@/lib/images';
import { readStore, LOCAL_USER_ID } from '@/lib/local/store';
import { localDelete, localGet, localInsert, localUpdate, newAlbum, newPerson, newPhoto } from '@/lib/local/tables';
import { isLocalMode } from '@/lib/mode';
import { slugify, SLUG_PATTERN } from '@/lib/slug';
import { createServiceClient, createSessionClient } from '@/lib/supabase/clients';
import type { DatePrecision, MemorialStatus, PersonRow, StaffRole } from '@/lib/supabase/database.types';

// Every action checks the staff member first (requireStaff). With a database, changes go
// through their own session so Row Level Security applies; in local mode (no database, on
// your own computer) they go to the local store, which applies the same rules.

/** `message` is a key under Admin.* in the message files. */
export type AdminFormState = { status: 'idle' | 'success' | 'error'; message?: string };

type DbError = { code?: string; hint?: string | null; message?: string };

function errorKey(error: unknown): string {
  if (error instanceof ForbiddenError) return 'errors.forbidden';
  const e = error as DbError;
  switch (e?.hint) {
    case 'consent_required':
      return 'memorials.publishBlockedConsent';
    case 'minor_confirmation_required':
      return 'memorials.publishBlockedMinor';
    case 'minor_confirmation_admin_only':
      return 'memorials.minorAdminOnly';
  }
  if (e?.code === '23505') return 'memorials.slugTaken';
  if (e?.code === '23514' && e.message?.includes('people_dates_in_order')) return 'memorials.datesOrder';
  if (e?.code === '23514' && e.message?.includes('slug')) return 'memorials.slugInvalid';
  if (e?.code === '42501') return 'errors.forbidden';
  console.error('admin action failed', error);
  return 'errors.generic';
}

async function localeRedirect(href: string): Promise<never> {
  return redirect({ href, locale: await getLocale() });
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v ? v : null));

const formString = (formData: FormData, name: string) => {
  const v = formData.get(name);
  return typeof v === 'string' ? v : '';
};

// ---------------------------------------------------------------------------
// Signing in and out (database mode only; local mode has no sign-in)
// ---------------------------------------------------------------------------

export async function signIn(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  if (isLocalMode()) return localeRedirect('/admin');
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formString(formData, 'email').trim(),
    password: formString(formData, 'password'),
  });
  if (error) return { status: 'error', message: 'signInFailed' };
  return localeRedirect('/admin');
}

export async function signOut() {
  if (isLocalMode()) return localeRedirect('/remembered');
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  return localeRedirect('/admin/login');
}

export async function sendPasswordReset(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  if (isLocalMode()) return { status: 'error', message: 'errors.forbidden' };
  const supabase = await createSessionClient();
  // Same answer whether or not the address exists, so nobody can probe for staff accounts.
  await supabase.auth.resetPasswordForEmail(formString(formData, 'email').trim(), {
    redirectTo: `${env.siteUrl}/auth/confirm?next=/admin/set-password`,
  });
  return { status: 'success', message: 'resetLinkSent' };
}

export async function setPassword(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  if (isLocalMode()) return { status: 'error', message: 'errors.forbidden' };
  const supabase = await createSessionClient();
  const password = formString(formData, 'password');
  if (password.length < 10) return { status: 'error', message: 'errors.generic' };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: 'error', message: 'errors.generic' };
  return { status: 'success', message: 'passwordSaved' };
}

// ---------------------------------------------------------------------------
// Memorials
// ---------------------------------------------------------------------------

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || 'memorial';
  let rows: { id: string; slug: string }[];
  if (isLocalMode()) {
    rows = (await readStore()).people.filter((p) => p.slug.startsWith(root));
  } else {
    const supabase = await createSessionClient();
    rows = (await supabase.from('people').select('id, slug').like('slug', `${root}%`)).data ?? [];
  }
  const taken = new Set(rows.filter((r) => r.id !== ignoreId).map((r) => r.slug));
  if (!taken.has(root) && !['request', 'new'].includes(root)) return root;
  for (let n = 2; ; n++) if (!taken.has(`${root}-${n}`)) return `${root}-${n}`;
}

export async function createMemorial(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  let id: string;
  try {
    const staff = await requireStaff();
    const name = formString(formData, 'name').trim().slice(0, 200);
    if (!name) return { status: 'error', message: 'errors.generic' };
    if (isLocalMode()) {
      id = (await localInsert('people', newPerson({ name, slug: await uniqueSlug(name) }))).id;
    } else {
      const supabase = await createSessionClient();
      const { data, error } = await supabase
        .from('people')
        .insert({ name, slug: await uniqueSlug(name), status: 'draft', created_by: staff.userId })
        .select('id')
        .single();
      if (error) throw error;
      id = data.id;
    }
  } catch (error) {
    return { status: 'error', message: errorKey(error) };
  }
  return localeRedirect(`/admin/memorials/${id}`);
}

const PRECISIONS = ['day', 'month', 'year'] as const;
const STATUSES = ['draft', 'pending', 'published'] as const;

const memorialSchema = z.object({
  name: z.string().trim().min(1).max(200),
  known_as: text(60),
  slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN).max(80),
  birth_date: z.union([z.iso.date(), z.literal('').transform(() => null)]),
  birth_date_precision: z.enum(PRECISIONS),
  death_date: z.union([z.iso.date(), z.literal('').transform(() => null)]),
  death_date_precision: z.enum(PRECISIONS),
  country: z.string().transform((v) => ((NPH_COUNTRIES as readonly string[]).includes(v) ? v : null)),
  home: text(200),
  story: text(40000),
  story_lang: z.string().transform((v) => (/^[a-z]{2,3}$/.test(v) ? v : null)),
  status: z.enum(STATUSES),
  consent_confirmed: z.boolean(),
  consent_note: text(4000),
  minor: z.boolean(),
});

export async function updateMemorial(personId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    const staff = await requireStaff();
    const parsed = memorialSchema.safeParse({
      ...Object.fromEntries(
        [
          'name',
          'known_as',
          'slug',
          'birth_date',
          'birth_date_precision',
          'death_date',
          'death_date_precision',
          'country',
          'home',
          'story',
          'story_lang',
          'status',
          'consent_note',
        ].map((k) => [k, formString(formData, k)]),
      ),
      consent_confirmed: formData.get('consent_confirmed') === 'on',
      minor: formData.get('minor') === 'on',
    });
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0] ?? '');
      return { status: 'error', message: field === 'slug' ? 'memorials.slugInvalid' : 'errors.generic' };
    }

    const update: Partial<PersonRow> = {
      ...parsed.data,
      birth_date_precision: parsed.data.birth_date_precision as DatePrecision,
      death_date_precision: parsed.data.death_date_precision as DatePrecision,
      status: parsed.data.status as MemorialStatus,
    };

    if (isLocalMode()) {
      // You are the only admin here, so the minor confirmation is yours to give.
      if (formData.has('minor_confirm_present')) {
        const confirm = formData.get('minor_confirm') === 'on';
        const current = await localGet('people', personId);
        if (confirm && !current?.minor_confirmed_at) {
          update.minor_confirmed_at = new Date().toISOString();
          update.minor_confirmed_by = LOCAL_USER_ID;
        }
        if (!confirm && current?.minor_confirmed_at) {
          update.minor_confirmed_at = null;
          update.minor_confirmed_by = null;
        }
      }
      await localUpdate('people', personId, update);
    } else {
      // Only admins see the confirmation box; the database checks the role again.
      if (staff.role === 'admin' && formData.has('minor_confirm_present')) {
        const confirm = formData.get('minor_confirm') === 'on';
        const supabase = await createSessionClient();
        const { data: current } = await supabase.from('people').select('minor_confirmed_at').eq('id', personId).single();
        if (confirm && !current?.minor_confirmed_at) update.minor_confirmed_at = new Date().toISOString();
        if (!confirm && current?.minor_confirmed_at) update.minor_confirmed_at = null;
      }
      const supabase = await createSessionClient();
      const { error } = await supabase.from('people').update(update).eq('id', personId);
      if (error) throw error;
    }
  } catch (error) {
    return { status: 'error', message: errorKey(error) };
  }
  refresh();
  return { status: 'success', message: 'memorials.saved' };
}

export async function deleteMemorial(personId: string) {
  await requireStaff('admin');
  if (isLocalMode()) {
    const data = await readStore();
    const images = [
      data.people.find((p) => p.id === personId)?.portrait_url,
      ...data.photos.filter((p) => p.person_id === personId).map((p) => p.storage_path),
      ...data.tributes.filter((t) => t.person_id === personId).map((t) => t.photo_url),
    ];
    await localDelete('people', personId);
    for (const path of images) await imageStorage().remove(path);
    return localeRedirect('/admin/memorials');
  }
  const supabase = await createSessionClient();
  const { data: person } = await supabase.from('people').select('portrait_url').eq('id', personId).single();
  const { data: photos } = await supabase.from('photos').select('storage_path').eq('person_id', personId);
  const { data: tributes } = await supabase.from('tributes').select('photo_url').eq('person_id', personId);
  const { error } = await supabase.from('people').delete().eq('id', personId);
  if (error) throw error;
  const service = createServiceClient();
  for (const path of [person?.portrait_url, ...(photos ?? []).map((p) => p.storage_path), ...(tributes ?? []).map((t) => t.photo_url)]) {
    await deleteImage(service, path);
  }
  return localeRedirect('/admin/memorials');
}

export async function uploadPortrait(personId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    await requireStaff();
    const file = formData.get('portrait');
    if (!hasFile(file)) return { status: 'error', message: 'errors.generic' };
    const image = await processImage(file);
    if (typeof image === 'string') return { status: 'error', message: 'errors.generic' };
    if (isLocalMode()) {
      const storage = imageStorage();
      const previous = (await localGet('people', personId))?.portrait_url;
      const { path } = await storage.store('media', `portraits/${personId}`, image);
      await localUpdate('people', personId, { portrait_url: path });
      await storage.remove(previous);
    } else {
      const supabase = await createSessionClient();
      const { data: person, error: readError } = await supabase.from('people').select('portrait_url').eq('id', personId).single();
      if (readError) throw readError;
      const service = createServiceClient();
      const { path } = await storeImage(service, 'media', `portraits/${personId}`, image);
      const { error } = await supabase.from('people').update({ portrait_url: path }).eq('id', personId);
      if (error) {
        await deleteImage(service, path);
        throw error;
      }
      await deleteImage(service, person.portrait_url);
    }
  } catch (error) {
    return { status: 'error', message: errorKey(error) };
  }
  refresh();
  return { status: 'success', message: 'memorials.saved' };
}

export async function removePortrait(personId: string) {
  await requireStaff();
  if (isLocalMode()) {
    const previous = (await localGet('people', personId))?.portrait_url;
    await localUpdate('people', personId, { portrait_url: null });
    await imageStorage().remove(previous);
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { data: person } = await supabase.from('people').select('portrait_url').eq('id', personId).single();
  const { error } = await supabase.from('people').update({ portrait_url: null }).eq('id', personId);
  if (error) throw error;
  await deleteImage(createServiceClient(), person?.portrait_url);
  refresh();
}

// ---------------------------------------------------------------------------
// Albums and photos
// ---------------------------------------------------------------------------

export async function createAlbum(personId: string, formData: FormData) {
  await requireStaff();
  const title = formString(formData, 'title').trim().slice(0, 200);
  if (!title) return;
  const description = formString(formData, 'description').trim().slice(0, 2000) || null;
  if (isLocalMode()) {
    const count = (await readStore()).albums.filter((a) => a.person_id === personId).length;
    await localInsert('albums', newAlbum({ person_id: personId, title, description, sort_order: count }));
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { count } = await supabase.from('albums').select('id', { count: 'exact', head: true }).eq('person_id', personId);
  const { error } = await supabase.from('albums').insert({ person_id: personId, title, description, sort_order: count ?? 0 });
  if (error) throw error;
  refresh();
}

export async function updateAlbum(albumId: string, formData: FormData) {
  await requireStaff();
  const title = formString(formData, 'title').trim().slice(0, 200);
  if (!title) return;
  const description = formString(formData, 'description').trim().slice(0, 2000) || null;
  if (isLocalMode()) {
    await localUpdate('albums', albumId, { title, description });
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.from('albums').update({ title, description }).eq('id', albumId);
  if (error) throw error;
  refresh();
}

export async function deleteAlbum(albumId: string) {
  await requireStaff();
  // Photos stay; they just leave the album.
  if (isLocalMode()) {
    await localDelete('albums', albumId);
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.from('albums').delete().eq('id', albumId);
  if (error) throw error;
  refresh();
}

export async function addPhoto(personId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    await requireStaff();
    const file = formData.get('photo');
    if (!hasFile(file)) return { status: 'error', message: 'errors.generic' };
    const image = await processImage(file);
    if (typeof image === 'string') return { status: 'error', message: 'errors.generic' };
    const albumId = formString(formData, 'album_id') || null;
    const caption = formString(formData, 'caption').trim().slice(0, 1000) || null;
    const contributedBy = formString(formData, 'contributed_by').trim().slice(0, 120) || null;

    if (isLocalMode()) {
      const { path, thumbPath } = await imageStorage().store('media', `photos/${personId}`, image);
      const count = (await readStore()).photos.filter((p) => p.person_id === personId).length;
      await localInsert(
        'photos',
        newPhoto({
          person_id: personId,
          album_id: albumId,
          storage_path: path,
          thumb_path: thumbPath,
          width: image.width,
          height: image.height,
          caption,
          contributed_by: contributedBy,
          status: 'approved', // added by you, so already reviewed
          sort_order: count,
        }),
      );
    } else {
      const service = createServiceClient();
      const { path, thumbPath } = await storeImage(service, 'media', `photos/${personId}`, image);
      const supabase = await createSessionClient();
      const { count } = await supabase.from('photos').select('id', { count: 'exact', head: true }).eq('person_id', personId);
      const { error } = await supabase.from('photos').insert({
        person_id: personId,
        album_id: albumId,
        storage_path: path,
        thumb_path: thumbPath,
        width: image.width,
        height: image.height,
        caption,
        contributed_by: contributedBy,
        status: 'approved', // added by staff, so already reviewed
        sort_order: count ?? 0,
      });
      if (error) {
        await deleteImage(service, path);
        throw error;
      }
    }
  } catch (error) {
    return { status: 'error', message: errorKey(error) };
  }
  refresh();
  return { status: 'success', message: 'memorials.saved' };
}

export async function updatePhoto(photoId: string, formData: FormData) {
  await requireStaff();
  const patch = {
    album_id: formString(formData, 'album_id') || null,
    caption: formString(formData, 'caption').trim().slice(0, 1000) || null,
    contributed_by: formString(formData, 'contributed_by').trim().slice(0, 120) || null,
  };
  if (isLocalMode()) {
    await localUpdate('photos', photoId, patch);
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.from('photos').update(patch).eq('id', photoId);
  if (error) throw error;
  refresh();
}

export async function setPhotoHidden(photoId: string, hidden: boolean) {
  await requireStaff();
  if (isLocalMode()) {
    await localUpdate('photos', photoId, { hidden });
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.from('photos').update({ hidden }).eq('id', photoId);
  if (error) throw error;
  refresh();
}

export async function movePhoto(photoId: string, direction: -1 | 1) {
  await requireStaff();
  if (isLocalMode()) {
    const data = await readStore();
    const photo = data.photos.find((p) => p.id === photoId);
    if (!photo) return;
    const ids = data.photos
      .filter((p) => p.person_id === photo.person_id && p.album_id === photo.album_id)
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
      .map((p) => p.id);
    const from = ids.indexOf(photoId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    for (const [index, id] of ids.entries()) await localUpdate('photos', id, { sort_order: index });
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { data: photo } = await supabase.from('photos').select('person_id, album_id').eq('id', photoId).single();
  if (!photo) return;
  let query = supabase.from('photos').select('id').eq('person_id', photo.person_id).order('sort_order').order('created_at');
  query = photo.album_id ? query.eq('album_id', photo.album_id) : query.is('album_id', null);
  const { data: siblings } = await query;
  const ids = (siblings ?? []).map((s) => s.id);
  const from = ids.indexOf(photoId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await Promise.all(ids.map((id, index) => supabase.from('photos').update({ sort_order: index }).eq('id', id)));
  refresh();
}

export async function deletePhoto(photoId: string) {
  await requireStaff();
  if (isLocalMode()) {
    const photo = await localDelete('photos', photoId);
    await imageStorage().remove(photo?.storage_path);
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { data: photo } = await supabase.from('photos').select('storage_path').eq('id', photoId).single();
  const { error } = await supabase.from('photos').delete().eq('id', photoId);
  if (error) throw error;
  await deleteImage(createServiceClient(), photo?.storage_path);
  refresh();
}

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export async function moderateTribute(tributeId: string, decision: 'approve' | 'reject' | 'hide' | 'show' | 'delete') {
  await requireStaff();

  if (isLocalMode()) {
    const tribute = await localGet('tributes', tributeId);
    if (!tribute) return;
    const storage = imageStorage();
    if (decision === 'delete') {
      await localDelete('tributes', tributeId);
      await storage.remove(tribute.photo_url);
    } else if (decision === 'approve') {
      const photo = tribute.photo_url ? await storage.publish(tribute.photo_url, `tributes/${tribute.person_id}`) : null;
      await localUpdate('tributes', tributeId, { status: 'approved', hidden: false, photo_url: photo });
    } else if (decision === 'reject') {
      await localUpdate('tributes', tributeId, { status: 'rejected', photo_url: null });
      await storage.remove(tribute.photo_url);
    } else {
      await localUpdate('tributes', tributeId, { hidden: decision === 'hide' });
    }
    refresh();
    return;
  }

  const supabase = await createSessionClient();
  const { data: tribute, error: readError } = await supabase
    .from('tributes')
    .select('person_id, photo_url')
    .eq('id', tributeId)
    .single();
  if (readError) throw readError;
  const service = createServiceClient();

  if (decision === 'delete') {
    const { error } = await supabase.from('tributes').delete().eq('id', tributeId);
    if (error) throw error;
    await deleteImage(service, tribute.photo_url);
  } else if (decision === 'approve') {
    // An approved photo moves from the private uploads to the public media bucket.
    const photo = tribute.photo_url ? await publishUpload(service, tribute.photo_url, `tributes/${tribute.person_id}`) : null;
    const { error } = await supabase.from('tributes').update({ status: 'approved', hidden: false, photo_url: photo }).eq('id', tributeId);
    if (error) throw error;
  } else if (decision === 'reject') {
    const { error } = await supabase.from('tributes').update({ status: 'rejected', photo_url: null }).eq('id', tributeId);
    if (error) throw error;
    await deleteImage(service, tribute.photo_url);
  } else {
    const { error } = await supabase.from('tributes').update({ hidden: decision === 'hide' }).eq('id', tributeId);
    if (error) throw error;
  }
  refresh();
}

export async function moderateCandle(candleId: string, decision: 'approve' | 'reject' | 'hide' | 'delete') {
  await requireStaff();
  if (isLocalMode()) {
    if (decision === 'delete') await localDelete('candles', candleId);
    else if (decision === 'hide') await localUpdate('candles', candleId, { hidden: true });
    else await localUpdate('candles', candleId, { message_status: decision === 'approve' ? 'approved' : 'rejected' });
    refresh();
    return;
  }
  const supabase = await createSessionClient();
  const { error } =
    decision === 'delete'
      ? await supabase.from('candles').delete().eq('id', candleId)
      : decision === 'hide'
        ? await supabase.from('candles').update({ hidden: true }).eq('id', candleId)
        : await supabase
            .from('candles')
            .update({ message_status: decision === 'approve' ? 'approved' : 'rejected' })
            .eq('id', candleId);
  if (error) throw error;
  refresh();
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

const REQUEST_STATUSES = ['new', 'in_progress', 'accepted', 'declined'] as const;

export async function updateRequest(requestId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    await requireStaff();
    const status = z.enum(REQUEST_STATUSES).parse(formString(formData, 'status'));
    const staffNote = formString(formData, 'staff_note').trim().slice(0, 4000) || null;
    if (isLocalMode()) {
      await localUpdate('requests', requestId, { status, staff_note: staffNote });
    } else {
      const supabase = await createSessionClient();
      const { error } = await supabase.from('memorial_requests').update({ status, staff_note: staffNote }).eq('id', requestId);
      if (error) throw error;
    }
  } catch (error) {
    return { status: 'error', message: errorKey(error) };
  }
  refresh();
  return { status: 'success', message: 'memorials.saved' };
}

function consentNoteFrom(request: {
  requester_name: string;
  requester_relation: string;
  requester_email: string;
  family_informed: boolean;
  birth_date: string | null;
  death_date: string | null;
}) {
  return [
    `Request from ${request.requester_name} (${request.requester_relation}), ${request.requester_email}.`,
    request.family_informed ? 'Requester says the family knows and agrees.' : 'Requester did not confirm that the family agrees.',
    request.birth_date ? `Born (as given): ${request.birth_date}.` : null,
    request.death_date ? `Died (as given): ${request.death_date}.` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function createMemorialFromRequest(requestId: string) {
  const staff = await requireStaff();

  if (isLocalMode()) {
    const request = await localGet('requests', requestId);
    if (!request) return;
    if (request.person_id) return localeRedirect(`/admin/memorials/${request.person_id}`);
    const person = await localInsert(
      'people',
      newPerson({
        name: request.person_name,
        slug: await uniqueSlug(request.person_name),
        country: request.country,
        home: request.home,
        story: request.story,
        minor: request.is_minor,
        status: 'pending',
        consent_note: consentNoteFrom(request),
      }),
    );
    if (request.photo_path) {
      const portrait = await imageStorage().publish(request.photo_path, `portraits/${person.id}`);
      await localUpdate('people', person.id, { portrait_url: portrait });
    }
    await localUpdate('requests', requestId, { person_id: person.id, status: 'in_progress', photo_path: null });
    return localeRedirect(`/admin/memorials/${person.id}`);
  }

  const supabase = await createSessionClient();
  const { data: request, error: readError } = await supabase.from('memorial_requests').select('*').eq('id', requestId).single();
  if (readError) throw readError;
  if (request.person_id) return localeRedirect(`/admin/memorials/${request.person_id}`);

  const { data: person, error } = await supabase
    .from('people')
    .insert({
      name: request.person_name,
      slug: await uniqueSlug(request.person_name),
      country: request.country,
      home: request.home,
      story: request.story,
      minor: request.is_minor,
      status: 'pending',
      consent_note: consentNoteFrom(request),
      created_by: staff.userId,
    })
    .select('id')
    .single();
  if (error) throw error;

  if (request.photo_path) {
    const portrait = await publishUpload(createServiceClient(), request.photo_path, `portraits/${person.id}`);
    await supabase.from('people').update({ portrait_url: portrait }).eq('id', person.id);
  }
  await supabase.from('memorial_requests').update({ person_id: person.id, status: 'in_progress', photo_path: null }).eq('id', requestId);
  return localeRedirect(`/admin/memorials/${person.id}`);
}

// ---------------------------------------------------------------------------
// Staff (admins only; database mode only — local mode has no staff accounts)
// ---------------------------------------------------------------------------

async function adminCount() {
  const supabase = await createSessionClient();
  const { count } = await supabase.from('admin_users').select('user_id', { count: 'exact', head: true }).eq('role', 'admin');
  return count ?? 0;
}

export async function inviteStaff(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    await requireStaff('admin');
    if (isLocalMode()) throw new ForbiddenError();
    const email = z.email().parse(formString(formData, 'email').trim().toLowerCase());
    const role = z.enum(['admin', 'editor']).parse(formString(formData, 'role')) as StaffRole;
    const service = createServiceClient();

    let userId: string | undefined;
    const invite = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${env.siteUrl}/auth/confirm?next=/admin/set-password`,
    });
    if (invite.data.user) {
      userId = invite.data.user.id;
    } else {
      // Already has an account (for example a former staff member): just give them the role again.
      const { data } = await service.auth.admin.listUsers({ perPage: 1000 });
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (!userId) throw invite.error ?? new Error('invite failed');
    }

    const supabase = await createSessionClient();
    const { error } = await supabase.from('admin_users').upsert({ user_id: userId, role });
    if (error) throw error;
  } catch (error) {
    return { status: 'error', message: errorKey(error) };
  }
  refresh();
  return { status: 'success', message: 'staff.invited' };
}

export async function changeStaffRole(userId: string, role: StaffRole) {
  await requireStaff('admin');
  if (isLocalMode()) throw new ForbiddenError();
  if (role === 'editor' && (await adminCount()) <= 1) {
    const supabase = await createSessionClient();
    const { data } = await supabase.from('admin_users').select('role').eq('user_id', userId).single();
    if (data?.role === 'admin') return; // keep at least one admin
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.from('admin_users').update({ role }).eq('user_id', userId);
  if (error) throw error;
  refresh();
}

export async function removeStaff(userId: string) {
  await requireStaff('admin');
  if (isLocalMode()) throw new ForbiddenError();
  const supabase = await createSessionClient();
  const { data } = await supabase.from('admin_users').select('role').eq('user_id', userId).single();
  if (data?.role === 'admin' && (await adminCount()) <= 1) return; // keep at least one admin
  const { error } = await supabase.from('admin_users').delete().eq('user_id', userId);
  if (error) throw error;
  refresh();
}
