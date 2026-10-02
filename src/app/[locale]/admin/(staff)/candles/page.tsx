import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ActionButton } from '@/components/admin/ActionButton';
import { moderateCandle } from '@/lib/actions/admin';
import { requireStaffPage } from '@/lib/auth';
import { pendingCandles } from '@/lib/data/admin';
import { formatDateTime } from '@/lib/dates';

export default async function CandlesAdmin({ params }: PageProps<'/[locale]/admin/candles'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaffPage();
  const t = await getTranslations('Admin');
  const candles = await pendingCandles();

  return (
    <>
      <h1>{t('candles.pending')}</h1>
      {candles.length === 0 ? (
        <p className="mt-4">{t('candles.empty')}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {candles.map((candle) => (
            <li key={candle.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="max-w-text">
                <p className="text-small text-muted">
                  {t('candles.for', { name: candle.people?.name ?? '' })} · {formatDateTime(candle.created_at, locale)}
                </p>
                {candle.author_name && <p className="font-semibold">{candle.author_name}</p>}
                {candle.message && <p>{candle.message}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton action={moderateCandle.bind(null, candle.id, 'approve')} label={t('actions.approve')} quiet={false} />
                <ActionButton action={moderateCandle.bind(null, candle.id, 'reject')} label={t('actions.reject')} />
                <ActionButton action={moderateCandle.bind(null, candle.id, 'hide')} label={t('actions.hide')} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
