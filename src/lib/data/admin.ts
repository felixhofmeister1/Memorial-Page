import 'server-only';
import { createServiceClient, createSessionClient } from '@/lib/supabase/clients';
import type { MemorialRequestRow, PersonRow } from '@/lib/supabase/database.types';
import { isPendingUpload, publicImageUrl, splitStoragePath } from '@/lib/media';
import type { PublicAlbum, PublicPhoto } from '@/lib/data/public';

// All reads here use the staff member's own session, so Row Level Security applies.

function check<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

export async function dashboardCounts() {
  const supabase = await createSessionClient();
  const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  };
  const [tributes, candles, requests, unpublished] = await Promise.all([
    count(supabase.from('tributes').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    count(supabase.from('candles').select('id', { count: 'exact', head: true }).eq('message_status', 'pending')),
    count(supabase.from('memorial_requests').select('id', { count: 'exact', head: true }).eq('status', 'new')),
    count(supabase.from('people').select('id', { count: 'exact', head: true }).neq('status', 'published')),
  ]);
  return { tributes, candles, requests, unpublished };
}

export async function listMemorials() {
  const supabase = await createSessionClient();
  return check(
    await supabase
      .from('people')
      .select('id, slug, name, status, consent_confirmed, minor, minor_confirmed_at, sample, candle_count, death_date, updated_at')
      .order('updated_at', { ascending: false }),
  );
}

export async function getMemorial(id: string): Promise<PersonRow | null> {
  const supabase = await createSessionClient();
  return check(await supabase.from('people').select('*').eq('id', id).maybeSingle());
}

export async function getMemorialMedia(personId: string) {
  const supabase = await createSessionClient();
  const [albums, photos] = await Promise.all([
    supabase.from('albums').select('*').eq('person_id', personId).order('sort_order').order('created_at'),
    supabase.from('photos').select('*').eq('person_id', personId).order('sort_order').order('created_at'),
  ]);
  return { albums: check(albums) ?? [], photos: check(photos) ?? [] };
}

export async function knownHomes(): Promise<string[]> {
  const supabase = await createSessionClient();
  const rows = check(await supabase.from('people').select('home').not('home', 'is', null));
  return [...new Set((rows ?? []).map((r) => r.home as string))].sort((a, b) => a.localeCompare(b));
}

/** What the public page would show, for the preview of an unpublished memorial. */
export async function getPreviewContent(personId: string) {
  const supabase = await createSessionClient();
  const [albums, photos, tributes, candles] = await Promise.all([
    supabase.from('albums').select('id, title, description').eq('person_id', personId).order('sort_order'),
    supabase
      .from('photos')
      .select('id, album_id, storage_path, thumb_path, width, height, caption, contributed_by')
      .eq('person_id', personId)
      .eq('status', 'approved')
      .eq('hidden', false)
      .order('sort_order'),
    supabase
      .from('tributes')
      .select('id, author_name, author_relation, message, photo_url, created_at')
      .eq('person_id', personId)
      .eq('status', 'approved')
      .eq('hidden', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('candles')
      .select('id, author_name, message, created_at')
      .eq('person_id', personId)
      .eq('message_status', 'approved')
      .eq('hidden', false)
      .or('author_name.not.is.null,message.not.is.null')
      .order('created_at', { ascending: false })
      .limit(12),
  ]);
  const allPhotos = (check(photos) ?? []) as PublicPhoto[];
  const albumList = ((check(albums) ?? []) as PublicAlbum[])
    .map((album) => ({ ...album, photos: allPhotos.filter((p) => p.album_id === album.id) }))
    .filter((album) => album.photos.length > 0);
  return { albums: albumList, tributes: check(tributes) ?? [], candles: check(candles) ?? [] };
}

export async function pendingTributes() {
  const supabase = await createSessionClient();
  return check(
    await supabase
      .from('tributes')
      .select('*, people(name, slug)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(100),
  ) as Array<TributeWithPerson>;
}

export async function recentTributes() {
  const supabase = await createSessionClient();
  return check(
    await supabase
      .from('tributes')
      .select('*, people(name, slug)')
      .neq('status', 'pending')
      .order('moderated_at', { ascending: false, nullsFirst: false })
      .limit(40),
  ) as Array<TributeWithPerson>;
}

type TributeWithPerson = import('@/lib/supabase/database.types').TributeRow & { people: { name: string; slug: string } | null };

export async function pendingCandles() {
  const supabase = await createSessionClient();
  return check(
    await supabase
      .from('candles')
      .select('*, people(name, slug)')
      .eq('message_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(200),
  ) as Array<import('@/lib/supabase/database.types').CandleRow & { people: { name: string; slug: string } | null }>;
}

export async function listRequests() {
  const supabase = await createSessionClient();
  return check(
    await supabase
      .from('memorial_requests')
      .select('id, requester_name, person_name, country, status, is_minor, created_at')
      .order('created_at', { ascending: false }),
  );
}

export async function getRequest(id: string): Promise<MemorialRequestRow | null> {
  const supabase = await createSessionClient();
  return check(await supabase.from('memorial_requests').select('*').eq('id', id).maybeSingle());
}

/** Staff list with email addresses (emails live in the Auth schema, so this needs the service role). */
export async function listStaff() {
  const supabase = await createSessionClient();
  const rows = check(await supabase.from('admin_users').select('*').order('created_at')) ?? [];
  const service = createServiceClient();
  return Promise.all(
    rows.map(async (row) => {
      const { data } = await service.auth.admin.getUserById(row.user_id);
      return { ...row, email: data.user?.email ?? '' };
    }),
  );
}

/**
 * A viewable address for an image, also for uploads that are not public yet
 * (short-lived signed link, staff only).
 */
export async function viewableImageUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (!isPendingUpload(path)) return publicImageUrl(path);
  const { key } = splitStoragePath(path);
  const { data } = await createServiceClient().storage.from('uploads').createSignedUrl(key, 60 * 30);
  return data?.signedUrl ?? null;
}
