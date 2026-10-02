import { getLocale, getTranslations } from 'next-intl/server';
import { countryName } from '@/lib/countries';

/** "NPH Mexico · Casa San Salvador, Miacatlán" */
export async function Place({ country, home, className }: { country: string | null; home: string | null; className?: string }) {
  const locale = await getLocale();
  const t = await getTranslations('Person');
  const name = countryName(country, locale);
  const parts = [name ? t('nphCountry', { country: name }) : null, home].filter(Boolean);
  if (parts.length === 0) return null;
  return <p className={className}>{parts.join(' · ')}</p>;
}
