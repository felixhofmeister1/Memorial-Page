import { useI18n } from '../i18n';
import { countryName } from '../lib/countries';
import { formatDate, type PartialDate } from '../lib/dates';

export function LifeDates({ birth, death, class: className = '' }: { birth: PartialDate | null; death: PartialDate | null; class?: string }) {
  const { lang } = useI18n();
  if (!birth && !death) return null;
  return (
    <p class={className}>
      {birth && <time>{formatDate(birth, lang)}</time>}
      {birth && death && <span aria-hidden="true"> – </span>}
      {!birth && death && <span aria-hidden="true">† </span>}
      {death && <time>{formatDate(death, lang)}</time>}
    </p>
  );
}

export function Place({ country, home, class: className = '' }: { country: string; home: string; class?: string }) {
  const { lang } = useI18n();
  const parts = [home, country ? countryName(country, lang) : ''].filter(Boolean);
  if (parts.length === 0) return null;
  return <p class={className}>{parts.join(' · ')}</p>;
}
