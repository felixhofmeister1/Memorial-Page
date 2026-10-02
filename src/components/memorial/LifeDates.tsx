import { getLocale, getTranslations } from 'next-intl/server';
import { formatLifeDate } from '@/lib/dates';
import type { DatePrecision } from '@/lib/supabase/database.types';

type Props = {
  birth: string | null;
  birthPrecision: DatePrecision;
  death: string | null;
  deathPrecision: DatePrecision;
  className?: string;
};

function machineDate(date: string, precision: DatePrecision) {
  return precision === 'year' ? date.slice(0, 4) : precision === 'month' ? date.slice(0, 7) : date;
}

export async function LifeDates({ birth, birthPrecision, death, deathPrecision, className }: Props) {
  const locale = await getLocale();
  const t = await getTranslations('Person');
  const born = formatLifeDate(birth, birthPrecision, locale);
  const died = formatLifeDate(death, deathPrecision, locale);
  if (!born && !died) return null;

  return (
    <p className={className}>
      {born && (
        <>
          <span className="sr-only">{t('born')} </span>
          <time dateTime={machineDate(birth!, birthPrecision)}>{born}</time>
        </>
      )}
      {born && died && <span aria-hidden="true"> – </span>}
      {died && (
        <>
          <span className="sr-only">
            {born ? ', ' : ''}
            {t('died')}{' '}
          </span>
          <time dateTime={machineDate(death!, deathPrecision)}>{died}</time>
        </>
      )}
    </p>
  );
}
