import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LifeDates } from '@/components/memorial/LifeDates';
import { Place } from '@/components/memorial/Place';
import { Portrait } from '@/components/memorial/Portrait';
import { sortedCountries } from '@/lib/countries';
import { filterOptions, filterPeople, listPublishedPeople, type OverviewFilters } from '@/lib/data/public';

export async function generateMetadata({ params }: PageProps<'/[locale]/remembered'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Overview' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

function single(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim().slice(0, 100) : undefined;
}

export default async function OverviewPage({ params, searchParams }: PageProps<'/[locale]/remembered'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations('Overview');

  const query = await searchParams;
  const filters: OverviewFilters = {
    q: single(query.q),
    country: single(query.country),
    home: single(query.home),
    year: single(query.year),
  };
  const filtering = Object.values(filters).some(Boolean);

  const everyone = await listPublishedPeople();
  const people = filterPeople(everyone, filters);
  const options = filterOptions(everyone);
  const countries = sortedCountries(options.countries, locale);

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <h1>{t('title')}</h1>
      <p className="mt-4 max-w-text">{t('intro')}</p>

      {everyone.length > 0 && (
        <form method="get" role="search" className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="w-full sm:w-64">
            <label htmlFor="q" className="label">
              {t('searchLabel')}
            </label>
            <input id="q" name="q" type="search" className="field" placeholder={t('searchPlaceholder')} defaultValue={filters.q} />
          </div>
          {countries.length > 1 && (
            <div>
              <label htmlFor="country" className="label">
                {t('country')}
              </label>
              <select id="country" name="country" className="field" defaultValue={filters.country ?? ''}>
                <option value="">{t('allCountries')}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {options.homes.length > 1 && (
            <div>
              <label htmlFor="home" className="label">
                {t('home')}
              </label>
              <select id="home" name="home" className="field" defaultValue={filters.home ?? ''}>
                <option value="">{t('allHomes')}</option>
                {options.homes.map((home) => (
                  <option key={home} value={home}>
                    {home}
                  </option>
                ))}
              </select>
            </div>
          )}
          {options.years.length > 1 && (
            <div>
              <label htmlFor="year" className="label">
                {t('year')}
              </label>
              <select id="year" name="year" className="field" defaultValue={filters.year ?? ''}>
                <option value="">{t('allYears')}</option>
                {options.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="button">
            {t('show')}
          </button>
          {filtering && (
            <Link href="/remembered" className="py-2">
              {t('clear')}
            </Link>
          )}
        </form>
      )}

      <section aria-labelledby="results" className="mt-10">
        <h2 id="results" className="sr-only" aria-live="polite">
          {t('count', { count: people.length })}
        </h2>
        {everyone.length === 0 ? (
          <p>{t('nobodyYet')}</p>
        ) : people.length === 0 ? (
          <p>{t('noResults')}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {people.map((person) => (
              <li key={person.id}>
                <Link href={`/remembered/${person.slug}`} className="flex gap-4 py-5 no-underline sm:gap-6">
                  <Portrait path={person.portrait_url} name="" sizes="small" className="w-20 shrink-0 sm:w-24" />
                  <span className="block">
                    <span className="block text-h3 font-semibold underline-offset-2 hover:underline">{person.name}</span>
                    <LifeDates
                      birth={person.birth_date}
                      birthPrecision={person.birth_date_precision}
                      death={person.death_date}
                      deathPrecision={person.death_date_precision}
                      className="mt-1"
                    />
                    <Place country={person.country} home={person.home} className="text-muted" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="request-heading" className="mt-14 max-w-text">
        <h2 id="request-heading" className="text-h3">
          {t('requestTitle')}
        </h2>
        <p className="mt-2">{t('requestText')}</p>
        <p className="mt-3">
          <Link href="/remembered/request">{t('requestLink')}</Link>
        </p>
      </section>
    </div>
  );
}
