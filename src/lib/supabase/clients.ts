import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient as createPlainClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import type { Database } from './database.types';

/**
 * For public pages and public submissions. Uses the anon key and no cookies,
 * so Row Level Security sees an anonymous visitor even if staff are signed in.
 */
export function createPublicClient() {
  return createPlainClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * For the admin area. Carries the staff member's session from cookies,
 * so Row Level Security applies their role.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Bypasses Row Level Security. Only for work the public must not do directly:
 * counting submissions for rate limits, writing uploaded images to storage,
 * and inviting staff. Never pass its results to the browser unfiltered.
 */
export function createServiceClient() {
  return createPlainClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
