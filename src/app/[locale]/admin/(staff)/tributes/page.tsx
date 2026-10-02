/* eslint-disable @next/next/no-img-element -- admin view of uploaded photos */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ActionButton } from '@/components/admin/ActionButton';
import { Link } from '@/i18n/navigation';
import { moderateTribute } from '@/lib/actions/admin';
import { requireStaffPage } from '@/lib/auth';
import { pendingTributes, recentTributes, viewableImageUrl } from '@/lib/data/admin';
import { formatDateTime } from '@/lib/dates';

export default async function TributesAdmin({ params }: PageProps<'/[locale]/admin/tributes'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaffPage();
  const t = await getTranslations('Admin');
  const [pending, recent] = await Promise.all([pendingTributes(), recentTributes()]);
  const photoUrls = await Promise.all(pending.map((tribute) => viewableImageUrl(tribute.photo_url)));

  return (
    <>
      <h1>{t('tributes.pending')}</h1>
      {pending.length === 0 ? (
        <p className="mt-4">{t('tributes.empty')}</p>
      ) : (
        <ol className="mt-6 divide-y divide-line border-y border-line">
          {pending.map((tribute, i) => (
            <li key={tribute.id} className="py-6">
              <p className="text-small text-muted">
                {t('tributes.for', { name: tribute.people?.name ?? '' })} · {formatDateTime(tribute.created_at, locale)}
              </p>
              <p className="mt-2 max-w-text whitespace-pre-line">{tribute.message}</p>
              {photoUrls[i] && <img src={photoUrls[i]!} alt={t('tributes.photo')} className="mt-3 max-h-64 w-auto" />}
              <p className="mt-2 text-small">
                <span className="font-semibold">{tribute.author_name}</span>
                {tribute.author_relation && <span>, {tribute.author_relation}</span>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton action={moderateTribute.bind(null, tribute.id, 'approve')} label={t('actions.approve')} quiet={false} />
                <ActionButton action={moderateTribute.bind(null, tribute.id, 'reject')} label={t('actions.reject')} />
              </div>
            </li>
          ))}
        </ol>
      )}

      <h2 className="mt-14">{t('tributes.recent')}</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line text-small">
        {recent.map((tribute) => (
          <li key={tribute.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0 max-w-text">
              <p className="text-muted">
                {tribute.people && <Link href={`/remembered/${tribute.people.slug}`}>{tribute.people.name}</Link>} ·{' '}
                {tribute.hidden ? t('status.hidden') : t(`status.${tribute.status}`)}
              </p>
              <p className="line-clamp-2">{tribute.message}</p>
              <p className="font-semibold">{tribute.author_name}</p>
            </div>
            <div className="flex gap-2">
              {tribute.status === 'approved' && (
                <ActionButton
                  action={moderateTribute.bind(null, tribute.id, tribute.hidden ? 'show' : 'hide')}
                  label={tribute.hidden ? t('actions.show') : t('actions.hide')}
                />
              )}
              <ActionButton action={moderateTribute.bind(null, tribute.id, 'delete')} label={t('actions.delete')} confirm={t('actions.confirmDelete')} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
