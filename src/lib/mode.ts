import 'server-only';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';

/**
 * The app runs in one of three modes:
 *
 *  database  SUPABASE_URL and SUPABASE_ANON_KEY are set. Everything is stored in Supabase;
 *            the admin area needs a staff sign-in.
 *
 *  local     No database, running on your own computer (`npm run dev`, or a production build
 *            started with MEMORIAL_LOCAL=true). Everything works and is saved in the data/
 *            folder. The admin area needs no sign-in, so it only answers requests that come
 *            from this computer (localhost).
 *
 *  preview   No database and deployed somewhere (a production build without MEMORIAL_LOCAL).
 *            Read-only: memorials come from src/content/memorials.ts, forms save nothing,
 *            and there is no admin area.
 */
export type AppMode = 'database' | 'local' | 'preview';

export function hasDatabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function appMode(): AppMode {
  if (hasDatabase()) return 'database';
  if (process.env.NODE_ENV !== 'production' || process.env.MEMORIAL_LOCAL === 'true') return 'local';
  return 'preview';
}

export function isLocalMode(): boolean {
  return appMode() === 'local';
}

/** True when the request was made on this computer (the open local admin answers nothing else). */
export async function isLocalRequest(): Promise<boolean> {
  const host = ((await headers()).get('host') ?? '').toLowerCase();
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}

/**
 * Admin pages exist with a database (behind sign-in) or in local mode (no sign-in, this
 * computer only). In preview mode, and for local mode reached from elsewhere: not found.
 */
export async function requireAdminAvailable(): Promise<void> {
  await connection(); // decided per request, never baked into a build
  const mode = appMode();
  if (mode === 'database') return;
  if (mode === 'local' && (await isLocalRequest())) return;
  notFound();
}

/** Pages that only make sense with a database (sign-in, password). */
export function requireDatabase(): void {
  if (!hasDatabase()) notFound();
}
