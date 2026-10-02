import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { requireStaffPage } from '@/lib/auth';
import { countryName } from '@/lib/countries';
import { listRequests } from '@/lib/data/admin';
import { formatDateTime } from '@/lib/dates';

export default async function RequestsAdmin({ params }: PageProps<'/[locale]/admin/requests'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaffPage();
  const t = await getTranslations('Admin');
  const requests = (await listRequests()) ?? [];

  return (
    <>
      <h1>{t('nav.requests')}</h1>
      {requests.length === 0 ? (
        <p className="mt-4">{t('requests.empty')}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {requests.map((r) => (
            <li key={r.id} className="py-4">
              <Link href={`/admin/requests/${r.id}`} className="font-semibold">
                {r.person_name}
              </Link>
              <p className="text-small text-muted">
                {t(`status.${r.status}`)} · {t('requests.from')} {r.requester_name}
                {r.country && ` · ${countryName(r.country, locale)}`}
                {r.is_minor && ` · ${t('requests.isMinor')}`} · {formatDateTime(r.created_at, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
