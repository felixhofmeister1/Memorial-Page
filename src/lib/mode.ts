import 'server-only';
import { notFound } from 'next/navigation';

/**
 * Preview mode: until the Supabase keys are set, the site shows the memorials from
 * src/content/memorials.ts, forms check what people type but save nothing, and the
 * admin area and sign-in do not exist. Setting SUPABASE_URL and SUPABASE_ANON_KEY
 * switches everything to the database.
 */
export function hasDatabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

/** For admin pages: they only exist once there is a database. */
export function requireDatabase(): void {
  if (!hasDatabase()) notFound();
}
