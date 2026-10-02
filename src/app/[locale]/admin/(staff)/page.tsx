import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { requireStaffPage } from '@/lib/auth';
import { dashboardCounts } from '@/lib/data/admin';

export default async function AdminHome({ params }: PageProps<'/[locale]/admin'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaffPage();
  const t = await getTranslations('Admin');
  const counts = await dashboardCounts();

  const rows = [
    ['/admin/tributes', t('dashboard.pendingTributes', { count: counts.tributes }), counts.tributes],
    ['/admin/candles', t('dashboard.pendingCandles', { count: counts.candles }), counts.candles],
    ['/admin/requests', t('dashboard.newRequests', { count: counts.requests }), counts.requests],
    ['/admin/memorials', t('dashboard.unpublished', { count: counts.unpublished }), counts.unpublished],
  ] as const;

  return (
    <>
      <h1>{t('dashboard.waiting')}</h1>
      <ul className="mt-6 space-y-3">
        {rows.map(([href, label, count]) => (
          <li key={href}>
            {count > 0 ? (
              <Link href={href} className="font-semibold">
                {label}
              </Link>
            ) : (
              <span className="text-muted">{label}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
