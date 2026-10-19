import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { signOut } from '@/lib/actions/admin';
import { requireStaffPage } from '@/lib/auth';
import { isLocalMode } from '@/lib/mode';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StaffLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  const staff = await requireStaffPage();
  const t = await getTranslations('Admin');
  const local = isLocalMode(); // no accounts on this computer: no staff list, password or sign-out
  const links = [
    ['/admin', t('nav.overview')],
    ['/admin/memorials', t('nav.memorials')],
    ['/admin/tributes', t('nav.tributes')],
    ['/admin/candles', t('nav.candles')],
    ['/admin/requests', t('nav.requests')],
    ...(staff.role === 'admin' && !local ? [['/admin/staff', t('nav.staff')]] : []),
    ...(local ? [] : [['/admin/set-password', t('nav.account')]]),
  ] as const;

  return (
    <div className="ui mx-auto max-w-site px-gutter py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
        <nav aria-label={t('title')}>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        {local ? (
          <p className="text-small text-muted">{t('localNote')}</p>
        ) : (
          <form action={signOut} className="flex items-baseline gap-3 text-small">
            <span className="text-muted">
              {staff.email} · {t(`role.${staff.role}`)}
            </span>
            <button type="submit" className="underline">
              {t('signOut')}
            </button>
          </form>
        )}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
