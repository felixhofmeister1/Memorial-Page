import { useMemo, useState } from 'preact/hooks';
import { Candle } from '../components/Candle';
import { LifeDates, Place } from '../components/LifeDates';
import { Portrait } from '../components/Portrait';
import { useLive } from '../data/hooks';
import { getMeta, listPeople, sortPeople, type PersonListItem } from '../data/store';
import { useI18n } from '../i18n';
import { countryName } from '../lib/countries';
import { formatDate } from '../lib/dates';
import { href, navigate, personPath } from '../lib/router';
import { plain } from '../lib/text';

type Order = 'name' | 'death' | 'added';

function PersonTile({ person }: { person: PersonListItem }) {
  const { t } = useI18n();
  return (
    <li class="tile">
      <a href={href(personPath(person.slug))} class="tile-link">
        <Portrait imageId={person.portraitId} name={person.name} alt="" class="tile-portrait" />
        <span class="tile-name">{person.name}</span>
      </a>
      <LifeDates birth={person.birth} death={person.death} class="tile-dates" />
      <Place country={person.country} home={person.home} class="tile-place" />
      {person.candles > 0 && (
        <p class="tile-candles">
          <Candle lit />
          {t.home.candles(person.candles)}
        </p>
      )}
    </li>
  );
}

function ThisMonth({ people }: { people: PersonListItem[] }) {
  const { t, lang } = useI18n();
  const today = new Date();
  const month = today.getMonth() + 1;
  const list = people
    .filter((p) => p.death?.d && p.death.m === month)
    .sort((a, b) => (a.death!.d ?? 0) - (b.death!.d ?? 0));
  if (list.length === 0) return null;
  return (
    <section class="this-month" aria-labelledby="month-heading">
      <h2 id="month-heading" class="eyebrow">
        {t.home.thisMonth}
      </h2>
      <ul>
        {list.map((p) => (
          <li key={p.id}>
            <a href={href(personPath(p.slug))}>{p.name}</a>{' '}
            <span class="muted">{t.home.anniversary(formatDate(p.death!, lang), today.getFullYear() - p.death!.y)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Home({ query }: { query: URLSearchParams }) {
  const { t, lang } = useI18n();
  const { data: people, error } = useLive(listPeople, []);
  const { data: backup } = useLive(async () => ({ change: await getMeta<string>('lastChangeAt'), backup: await getMeta<string>('lastBackupAt') }), []);

  const q = query.get('q') ?? '';
  const country = query.get('country') ?? '';
  const home = query.get('home') ?? '';
  const year = query.get('year') ?? '';
  const order = (['name', 'death', 'added'].includes(query.get('order') ?? '') ? query.get('order') : 'name') as Order;
  const [search, setSearch] = useState(q);

  const setQuery = (changes: Record<string, string>) => {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const text = next.toString();
    navigate(text ? `/?${text}` : '/', { replace: true });
  };

  const options = useMemo(() => {
    const all = people ?? [];
    return {
      countries: [...new Set(all.map((p) => p.country).filter(Boolean))].sort((a, b) => countryName(a, lang).localeCompare(countryName(b, lang))),
      homes: [...new Set(all.map((p) => p.home).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
      years: [...new Set(all.map((p) => p.death?.y).filter((y): y is number => !!y))].sort((a, b) => b - a),
    };
  }, [people, lang]);

  const shown = useMemo(() => {
    const needle = plain(q);
    const filtered = (people ?? []).filter(
      (p) =>
        (!needle || plain(`${p.name} ${p.knownAs}`).includes(needle)) &&
        (!country || p.country === country) &&
        (!home || p.home === home) &&
        (!year || String(p.death?.y) === year),
    );
    return sortPeople(filtered, order);
  }, [people, q, country, home, year, order]);

  if (error) return <p class="page-message">{t.common.storageError}</p>;
  if (!people) return <p class="page-message" aria-busy="true">{t.common.loading}</p>;

  const filtering = Boolean(q || country || home || year);
  const unsaved = backup?.change && (!backup.backup || backup.backup < backup.change);

  return (
    <>
      <header class="page-head">
        <h1 tabIndex={-1}>{t.home.title}</h1>
        <p class="lede">{t.home.lede}</p>
      </header>

      {people.length === 0 ? (
        <section class="empty-state">
          <Candle lit size="large" />
          <h2>{t.home.emptyTitle}</h2>
          <p>{t.home.emptyText}</p>
          <a class="button" href={href('/new')}>
            {t.home.emptyButton}
          </a>
          <p class="hint">{t.site.private}</p>
        </section>
      ) : (
        <>
          <ThisMonth people={people} />

          <form
            class="finder"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery({ q: search.trim() });
            }}
          >
            <div class="finder-search">
              <label class="label" for="q">
                {t.home.search}
              </label>
              <div class="finder-row">
                <input id="q" type="search" class="field" value={search} onInput={(e) => setSearch(e.currentTarget.value)} autoComplete="off" />
                <button type="submit" class="button">
                  {t.home.show}
                </button>
              </div>
            </div>
            {options.countries.length > 0 && (
              <div>
                <label class="label" for="country">
                  {t.home.country}
                </label>
                <select id="country" class="field" value={country} onChange={(e) => setQuery({ country: e.currentTarget.value })}>
                  <option value="">{t.home.all}</option>
                  {options.countries.map((c) => (
                    <option key={c} value={c}>
                      {countryName(c, lang)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {options.homes.length > 0 && (
              <div>
                <label class="label" for="home">
                  {t.home.home}
                </label>
                <select id="home" class="field" value={home} onChange={(e) => setQuery({ home: e.currentTarget.value })}>
                  <option value="">{t.home.all}</option>
                  {options.homes.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {options.years.length > 0 && (
              <div>
                <label class="label" for="year">
                  {t.home.year}
                </label>
                <select id="year" class="field" value={year} onChange={(e) => setQuery({ year: e.currentTarget.value })}>
                  <option value="">{t.home.all}</option>
                  {options.years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label class="label" for="order">
                {t.home.order}
              </label>
              <select id="order" class="field" value={order} onChange={(e) => setQuery({ order: e.currentTarget.value === 'name' ? '' : e.currentTarget.value })}>
                <option value="name">{t.home.byName}</option>
                <option value="death">{t.home.byDeath}</option>
                <option value="added">{t.home.byAdded}</option>
              </select>
            </div>
          </form>

          <div class="list-head">
            <h2 class="eyebrow">{t.site.everyone}</h2>
            <p class="muted" aria-live="polite">
              {filtering ? t.home.shownOf(shown.length, people.length) : t.home.count(people.length)}
              {filtering && (
                <>
                  {' · '}
                  <button
                    type="button"
                    class="link-button"
                    onClick={() => {
                      setSearch('');
                      setQuery({ q: '', country: '', home: '', year: '' });
                    }}
                  >
                    {t.home.clear}
                  </button>
                </>
              )}
            </p>
          </div>

          {shown.length === 0 ? (
            <p class="quiet-note">{t.home.noMatch}</p>
          ) : (
            <ul class="wall">
              {shown.map((person) => (
                <PersonTile key={person.id} person={person} />
              ))}
            </ul>
          )}

          {unsaved && (
            <p class="backup-nudge">
              {t.home.backupNudge} <a href={href('/about')}>{t.home.backupLink}</a>
            </p>
          )}
        </>
      )}
    </>
  );
}
