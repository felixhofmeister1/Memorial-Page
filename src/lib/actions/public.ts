'use server';

import { z } from 'zod';
import { routing } from '@/i18n/routing';
import { NPH_COUNTRIES } from '@/lib/countries';
import { fieldErrorsFrom, textValues, type ErrorCode, type FormState } from '@/lib/forms';
import { hasFile, imageStorage, processImage, storeImage, deleteImage, type ProcessedImage } from '@/lib/images';
import { localGet, localInsert, newCandle, newRequest, newTribute } from '@/lib/local/tables';
import { appMode } from '@/lib/mode';
import { checkFormToken, honeypotFilled, turnstilePassed, withinRateLimit } from '@/lib/spam';
import { createPublicClient, createServiceClient } from '@/lib/supabase/clients';

// ---------------------------------------------------------------------------
// Shared checks
// ---------------------------------------------------------------------------

type Gate = { ok: true } | { ok: false; state: FormState };

async function passGate(formData: FormData, values: Record<string, string>, minFillMs?: number): Promise<Gate> {
  // Bots that fill the hidden field get a friendly "thank you" and nothing is stored.
  if (honeypotFilled(formData)) return { ok: false, state: { status: 'success' } };

  const token = checkFormToken(formData.get('token'), minFillMs);
  if (token !== 'ok') {
    const code: ErrorCode = token === 'invalid' ? 'spam' : token;
    return { ok: false, state: { status: 'error', formError: code, values } };
  }
  if (!(await turnstilePassed(formData))) {
    return { ok: false, state: { status: 'error', formError: 'spam', values } };
  }
  return { ok: true };
}

function localeFrom(formData: FormData) {
  const value = formData.get('locale');
  return routing.locales.find((l) => l === value) ?? null;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const requiredText = (max: number) => z.string().trim().min(1).max(max);

/** Local mode: the memorial must exist and be published, as the database's access rules require. */
async function localPersonOpen(personId: string): Promise<boolean> {
  const person = await localGet('people', personId);
  return person?.status === 'published';
}

/** Checks an optional photo; returns the processed image, nothing, or a form state with the error. */
async function checkedPhoto(formData: FormData, values: Record<string, string>): Promise<ProcessedImage | null | FormState> {
  const photo = formData.get('photo');
  if (!hasFile(photo)) return null;
  const image = await processImage(photo);
  if (typeof image === 'string') return { status: 'error', fieldErrors: { photo: image }, values };
  return image;
}
const isFormState = (value: unknown): value is FormState => typeof value === 'object' && value !== null && 'status' in value;

/** Preview mode: the photo is still checked (so errors show as they will later), then dropped. */
async function previewResult(formData: FormData, values: Record<string, string>, extra: Partial<FormState> = {}): Promise<FormState> {
  const photo = formData.get('photo');
  if (hasFile(photo)) {
    const image = await processImage(photo);
    if (typeof image === 'string') return { status: 'error', fieldErrors: { photo: image }, values };
  }
  return { status: 'success', preview: true, ...extra };
}

function databaseErrorCode(error: { code?: string; hint?: string | null }): ErrorCode {
  if (error.hint === 'rate_limited') return 'rateLimited';
  if (error.code === '42501') return 'notFound'; // row-level security: page not published
  return 'server';
}

// ---------------------------------------------------------------------------
// Tribute
// ---------------------------------------------------------------------------

const tributeSchema = z.object({
  personId: z.uuid(),
  author_name: requiredText(120),
  author_relation: optionalText(120),
  message: requiredText(5000),
});

export async function submitTribute(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = textValues(formData, ['author_name', 'author_relation', 'message']);
  const gate = await passGate(formData, values);
  if (!gate.ok) return gate.state;

  const parsed = tributeSchema.safeParse({
    personId: formData.get('personId'),
    author_name: formData.get('author_name') ?? '',
    author_relation: formData.get('author_relation') ?? '',
    message: formData.get('message') ?? '',
  });
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error), values };
  const mode = appMode();
  if (mode === 'preview') return previewResult(formData, values);
  if (mode === 'local') {
    if (!(await localPersonOpen(parsed.data.personId))) return { status: 'error', formError: 'notFound', values };
    const image = await checkedPhoto(formData, values);
    if (isFormState(image)) return image;
    const photoPath = image ? (await imageStorage().store('uploads', 'tributes', image)).path : null;
    await localInsert(
      'tributes',
      newTribute({
        person_id: parsed.data.personId,
        author_name: parsed.data.author_name,
        author_relation: parsed.data.author_relation,
        message: parsed.data.message,
        photo_url: photoPath,
        locale: localeFrom(formData),
      }),
    );
    return { status: 'success' };
  }

  if (!(await withinRateLimit('tribute', 6, 3600))) {
    return { status: 'error', formError: 'rateLimited', values };
  }

  let photoPath: string | null = null;
  const photo = formData.get('photo');
  if (hasFile(photo)) {
    const image = await processImage(photo);
    if (typeof image === 'string') return { status: 'error', fieldErrors: { photo: image }, values };
    try {
      photoPath = (await storeImage(createServiceClient(), 'uploads', 'tributes', image)).path;
    } catch (error) {
      console.error('tribute photo upload failed', error);
      return { status: 'error', formError: 'server', values };
    }
  }

  const { error } = await createPublicClient().from('tributes').insert({
    person_id: parsed.data.personId,
    author_name: parsed.data.author_name,
    author_relation: parsed.data.author_relation,
    message: parsed.data.message,
    photo_url: photoPath,
    locale: localeFrom(formData),
  });

  if (error) {
    console.error('tribute insert failed', error);
    await deleteImage(createServiceClient(), photoPath);
    return { status: 'error', formError: databaseErrorCode(error), values };
  }
  return { status: 'success' };
}

// ---------------------------------------------------------------------------
// Candle
// ---------------------------------------------------------------------------

const candleSchema = z.object({
  personId: z.uuid(),
  author_name: optionalText(80),
  message: optionalText(280),
});

export async function lightCandle(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = textValues(formData, ['author_name', 'message']);
  // Lighting a quiet candle is one click, so no minimum time here; rate limits still apply.
  const gate = await passGate(formData, values, 0);
  if (!gate.ok) return gate.state;

  const parsed = candleSchema.safeParse({
    personId: formData.get('personId'),
    author_name: formData.get('author_name') ?? '',
    message: formData.get('message') ?? '',
  });
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error), values };
  const withWords = !!(parsed.data.author_name || parsed.data.message);
  const mode = appMode();
  if (mode === 'preview') return previewResult(formData, values, { withWords });
  if (mode === 'local') {
    if (!(await localPersonOpen(parsed.data.personId))) return { status: 'error', formError: 'notFound', values };
    await localInsert(
      'candles',
      newCandle({ person_id: parsed.data.personId, author_name: parsed.data.author_name, message: parsed.data.message }),
    );
    return { status: 'success', withWords };
  }

  if (!(await withinRateLimit('candle', 12, 3600))) {
    return { status: 'error', formError: 'rateLimited', values };
  }

  const { error } = await createPublicClient().from('candles').insert({
    person_id: parsed.data.personId,
    author_name: parsed.data.author_name,
    message: parsed.data.message,
  });
  if (error) {
    console.error('candle insert failed', error);
    return { status: 'error', formError: databaseErrorCode(error), values };
  }
  return { status: 'success', withWords: !!(parsed.data.author_name || parsed.data.message) };
}

// ---------------------------------------------------------------------------
// Memorial request
// ---------------------------------------------------------------------------

const REQUEST_FIELDS = [
  'requester_name',
  'requester_email',
  'requester_phone',
  'requester_relation',
  'person_name',
  'birth_date',
  'death_date',
  'country',
  'home',
  'story',
  'is_minor',
  'family_informed',
] as const;

const requestSchema = z.object({
  requester_name: requiredText(120),
  requester_email: z.string().trim().max(254).pipe(z.email()),
  requester_phone: optionalText(40),
  requester_relation: requiredText(200),
  person_name: requiredText(200),
  birth_date: optionalText(60),
  death_date: optionalText(60),
  country: z
    .string()
    .optional()
    .transform((v) => ((NPH_COUNTRIES as readonly string[]).includes(v ?? '') ? v! : null)),
  home: optionalText(200),
  story: optionalText(20000),
  is_minor: z.boolean(),
  family_informed: z.boolean(),
});

export async function requestMemorial(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = textValues(formData, REQUEST_FIELDS);
  const gate = await passGate(formData, values);
  if (!gate.ok) return gate.state;

  const raw: Record<string, unknown> = Object.fromEntries(
    REQUEST_FIELDS.map((field) => [field, formData.get(field) ?? '']),
  );
  raw.is_minor = formData.get('is_minor') === 'on';
  raw.family_informed = formData.get('family_informed') === 'on';
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error), values };
  const mode = appMode();
  if (mode === 'preview') return previewResult(formData, values);
  if (mode === 'local') {
    const image = await checkedPhoto(formData, values);
    if (isFormState(image)) return image;
    const photoPath = image ? (await imageStorage().store('uploads', 'requests', image)).path : null;
    await localInsert('requests', newRequest({ ...parsed.data, photo_path: photoPath, locale: localeFrom(formData) }));
    return { status: 'success' };
  }

  if (!(await withinRateLimit('request', 3, 3600))) {
    return { status: 'error', formError: 'rateLimited', values };
  }

  let photoPath: string | null = null;
  const photo = formData.get('photo');
  if (hasFile(photo)) {
    const image = await processImage(photo);
    if (typeof image === 'string') return { status: 'error', fieldErrors: { photo: image }, values };
    try {
      photoPath = (await storeImage(createServiceClient(), 'uploads', 'requests', image)).path;
    } catch (error) {
      console.error('request photo upload failed', error);
      return { status: 'error', formError: 'server', values };
    }
  }

  const { error } = await createPublicClient()
    .from('memorial_requests')
    .insert({ ...parsed.data, photo_path: photoPath, locale: localeFrom(formData) });

  if (error) {
    console.error('memorial request insert failed', error);
    await deleteImage(createServiceClient(), photoPath);
    return { status: 'error', formError: databaseErrorCode(error), values };
  }
  return { status: 'success' };
}
