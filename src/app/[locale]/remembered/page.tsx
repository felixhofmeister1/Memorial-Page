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

  const selectClass = 'field';
  return (
    <div className="mx-auto max-w-site px-gutter pt-12 md:pt-20">
      <header className="max-w-[44rem]">
        <h1>{t('title')}</h1>
        <p className="lede mt-6 text-ink/85">{t('intro')}</p>
      </header>

      {everyone.length > 0 && (
        <form
          method="get"
          role="search"
          className="ui mt-12 grid grid-cols-2 items-end gap-x-3 gap-y-4 border-y border-line py-6 sm:gap-x-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto]"
        >
          <div className="col-span-2 lg:col-span-1">
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
              <select id="country" name="country" className={selectClass} defaultValue={filters.country ?? ''}>
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
              <select id="home" name="home" className={selectClass} defaultValue={filters.home ?? ''}>
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
              <select id="year" name="year" className={selectClass} defaultValue={filters.year ?? ''}>
                <option value="">{t('allYears')}</option>
                {options.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button type="submit" className="button">
              {t('show')}
            </button>
            {filtering && (
              <Link href="/remembered" className="whitespace-nowrap text-[0.9375rem]">
                {t('clear')}
              </Link>
            )}
          </div>
        </form>
      )}

      <section aria-labelledby="results" className="mt-12">
        <h2 id="results" className="eyebrow" aria-live="polite">
          {filtering ? t('count', { count: people.length }) : t('peopleHeading')}
        </h2>
        {everyone.length === 0 ? (
          <p className="mt-6 italic text-muted">{t('nobodyYet')}</p>
        ) : people.length === 0 ? (
          <p className="mt-6 italic text-muted">{t('noResults')}</p>
        ) : (
          <ul className="mt-5 grid gap-x-14 md:grid-cols-2">
            {people.map((person) => (
              <li key={person.id} className="border-t border-line">
                <Link href={`/remembered/${person.slug}`} className="group flex gap-5 py-7 text-ink no-underline sm:gap-6">
                  <Portrait path={person.portrait_url} name="" sizes="small" className="print w-24 shrink-0 sm:w-28" />
                  <span className="block min-w-0 self-center">
                    <span className="block font-serif text-[1.5rem] leading-[1.2] decoration-1 underline-offset-[5px] group-hover:underline">
                      {person.name}
                    </span>
                    <LifeDates
                      birth={person.birth_date}
                      birthPrecision={person.birth_date_precision}
                      death={person.death_date}
                      deathPrecision={person.death_date_precision}
                      className="mt-2 italic text-ink/85"
                    />
                    <Place country={person.country} home={person.home} className="ui mt-1 text-small text-muted" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="request-heading" className="panel mt-20 grid gap-6 p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div className="max-w-text">
          <h2 id="request-heading" className="text-h2">
            {t('requestTitle')}
          </h2>
          <p className="mt-3 text-ink/85">{t('requestText')}</p>
        </div>
        <p>
          <Link href="/remembered/request" className="button-quiet">
            {t('requestLink')}
          </Link>
        </p>
      </section>
    </div>
  );
}
