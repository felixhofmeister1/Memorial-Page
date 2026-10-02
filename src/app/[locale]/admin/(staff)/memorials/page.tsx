import { getTranslations, setRequestLocale } from 'next-intl/server';
import { StatefulForm } from '@/components/admin/StatefulForm';
import { Link } from '@/i18n/navigation';
import { createMemorial } from '@/lib/actions/admin';
import { requireStaffPage } from '@/lib/auth';
import { listMemorials } from '@/lib/data/admin';
import { formatDateTime } from '@/lib/dates';

export default async function MemorialsAdmin({ params }: PageProps<'/[locale]/admin/memorials'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaffPage();
  const t = await getTranslations('Admin');
  const memorials = (await listMemorials()) ?? [];

  return (
    <>
      <h1>{t('nav.memorials')}</h1>

      <StatefulForm action={createMemorial} submitLabel={t('actions.create')} className="mt-6 max-w-md">
        <label htmlFor="new-name" className="label">
          {t('memorials.new')}: {t('memorials.name')}
        </label>
        <input id="new-name" name="name" required maxLength={200} className="field" />
      </StatefulForm>

      {memorials.length === 0 ? (
        <p className="mt-8">{t('memorials.empty')}</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-small">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-4">{t('memorials.name')}</th>
                <th scope="col" className="py-2 pr-4">{t('memorials.status')}</th>
                <th scope="col" className="py-2 pr-4">{t('memorials.consent')}</th>
                <th scope="col" className="py-2 pr-4">{t('memorials.candles')}</th>
                <th scope="col" className="py-2">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {memorials.map((m) => (
                <tr key={m.id} className="border-b border-line align-top">
                  <td className="py-2 pr-4">
                    <Link href={`/admin/memorials/${m.id}`} className="font-semibold">
                      {m.name}
                    </Link>
                    {m.sample && <span className="text-muted"> · {t('memorials.sample')}</span>}
                    <span className="block text-muted">{formatDateTime(m.updated_at, locale)}</span>
                  </td>
                  <td className="py-2 pr-4">{t(`status.${m.status}`)}</td>
                  <td className="py-2 pr-4">
                    {m.consent_confirmed ? '✓' : '–'}
                    {m.minor && (
                      <span className="block text-muted">
                        {t('memorials.minor')}: {m.minor_confirmed_at ? '✓' : '–'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{m.candle_count}</td>
                  <td className="py-2">
                    {m.status === 'published' && <Link href={`/remembered/${m.slug}`}>{t('actions.view')}</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
