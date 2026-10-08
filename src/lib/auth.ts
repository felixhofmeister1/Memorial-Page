import 'server-only';
import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { hasDatabase, requireDatabase } from '@/lib/mode';
import { createSessionClient } from '@/lib/supabase/clients';
import type { StaffRole } from '@/lib/supabase/database.types';

export type Staff = { userId: string; email: string; role: StaffRole; displayName: string | null };

/** The signed-in user and, if they are on the staff list, their role. Verified with the Auth server. */
export const getCurrentStaff = cache(async () => {
  if (!hasDatabase()) return { user: null, staff: null };
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, staff: null };

  const { data } = await supabase.from('admin_users').select('role, display_name').eq('user_id', user.id).maybeSingle();
  const staff: Staff | null = data
    ? { userId: user.id, email: user.email ?? '', role: data.role, displayName: data.display_name }
    : null;
  return { user, staff };
});

/** For admin pages: sends visitors who are not signed in to the login page. */
export async function requireStaffPage(): Promise<Staff> {
  requireDatabase(); // no admin area before there is a database
  const { user, staff } = await getCurrentStaff();
  if (!user || !staff) {
    const locale = await getLocale();
    return redirect({ href: user ? '/admin/login?not=staff' : '/admin/login', locale });
  }
  return staff;
}

export class ForbiddenError extends Error {
  constructor() {
    super('forbidden');
  }
}

/** For server actions. Never trust that the form was only shown to staff. */
export async function requireStaff(role?: 'admin'): Promise<Staff> {
  const { staff } = await getCurrentStaff();
  if (!staff || (role === 'admin' && staff.role !== 'admin')) throw new ForbiddenError();
  return staff;
}
