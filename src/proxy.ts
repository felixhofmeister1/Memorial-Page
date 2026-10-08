import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const ADMIN_PATH = /^\/(?:(?:en|de|es)\/)?admin(?:\/|$)/;

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  // Only staff pages carry a session. Public pages stay cookie-free.
  // Without a database (preview mode) there is no admin area at all.
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!ADMIN_PATH.test(request.nextUrl.pathname) || !supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Refreshes an expired session and writes the new cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Everything except Next internals, the auth callback and files with an extension
  matcher: '/((?!_next|_vercel|auth|.*\\..*).*)',
};
