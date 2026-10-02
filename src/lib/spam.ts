import 'server-only';
import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { env } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase/clients';

// ---------------------------------------------------------------------------
// Form token: a signed timestamp, set when the form is rendered.
// People need more than a few seconds to write something; bots usually do not wait.
// ---------------------------------------------------------------------------

const MIN_FILL_MS = 3_000;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;

function sign(value: string) {
  return crypto.createHmac('sha256', env.submissionSecret).update(`form:${value}`).digest('base64url');
}

export function issueFormToken(): string {
  const issued = Date.now().toString(36);
  return `${issued}.${sign(issued)}`;
}

export type TokenCheck = 'ok' | 'tooFast' | 'expired' | 'invalid';

export function checkFormToken(token: FormDataEntryValue | null, minFillMs = MIN_FILL_MS): TokenCheck {
  if (typeof token !== 'string') return 'invalid';
  const [issued, signature] = token.split('.');
  if (!issued || !signature) return 'invalid';
  const expected = sign(issued);
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return 'invalid';
  }
  const age = Date.now() - parseInt(issued, 36);
  if (age < minFillMs) return 'tooFast';
  if (age > MAX_FILL_MS) return 'expired';
  return 'ok';
}

// ---------------------------------------------------------------------------
// Honeypot: a field that is hidden from people. If it has a value, a bot filled it in.
// ---------------------------------------------------------------------------

// An unusual name, so browsers' autofill never fills it in for real people.
export const HONEYPOT_FIELD = 'leave_this_empty';

export function honeypotFilled(formData: FormData): boolean {
  const value = formData.get(HONEYPOT_FIELD);
  return typeof value === 'string' && value.trim() !== '';
}

// ---------------------------------------------------------------------------
// Rate limits, counted in the database per hashed address.
// The address itself is never stored: the hash is salted with a secret and the
// current day, and the rows are deleted after a day.
// ---------------------------------------------------------------------------

async function clientAddress(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export async function withinRateLimit(action: string, limit: number, windowSeconds: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const address = await clientAddress();
  const key = crypto.createHash('sha256').update(`${env.submissionSecret}|${day}|${address}|${action}`).digest('hex');
  const { data, error } = await createServiceClient().rpc('hit_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error('rate limit check failed', error);
    // Fail open: the database's own flood guards still apply.
    return true;
  }
  return data === true;
}

// ---------------------------------------------------------------------------
// Optional Cloudflare Turnstile. Only active when both keys are configured.
// ---------------------------------------------------------------------------

export async function turnstilePassed(formData: FormData): Promise<boolean> {
  const secret = env.turnstileSecret;
  if (!secret) return true;
  const token = formData.get('cf-turnstile-response');
  if (typeof token !== 'string' || !token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: await clientAddress() });
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error('turnstile verification failed', error);
    return false;
  }
}
