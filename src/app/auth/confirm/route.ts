import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createSessionClient } from '@/lib/supabase/clients';

/**
 * Target of the links in staff emails (invitation, password reset).
 * The Supabase email templates must point here, see README "Staff accounts".
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/admin';
  // Only same-site paths, never another domain
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/admin';

  if (tokenHash && type) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }
  return NextResponse.redirect(new URL('/admin/login?link=invalid', request.url));
}
