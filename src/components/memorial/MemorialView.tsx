import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { shortName, type PublicAlbum, type PublicCandle, type PublicPerson, type PublicTribute } from '@/lib/data/public';
import { CandleForm } from './CandleForm';
import { DonateInMemory } from './DonateInMemory';
import { LifeDates } from './LifeDates';
import { PhotoAlbums } from './PhotoAlbums';
import { Place } from './Place';
import { Portrait } from './Portrait';
import { Story } from './Story';
import { TributeForm } from './TributeForm';
import { TributeList } from './TributeList';

type Props = {
  person: PublicPerson;
  albums: PublicAlbum[];
  tributes: PublicTribute[];
  candles: PublicCandle[];
  /** Fresh signed form token. Absent in the admin preview, where forms are not shown. */
  formToken?: string;
};

/** One memorial page. Used for the public page and for the admin preview. */
export async function MemorialView({ person, albums, tributes, candles, formToken }: Props) {
  const t = await getTranslations('Memorial');
  const tp = await getTranslations('Person');
  const tc = await getTranslations('Candle');
  const tt = await getTranslations('Tribute');
  const name = shortName(person);

  return (
    <article className="mx-auto max-w-site px-gutter py-10">
      {person.sample && <p className="mb-6 border-l-4 border-line pl-3 text-small text-muted">{tp('sample')}</p>}

      <header className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-10">
        <Portrait path={person.portrait_url} name={person.name} className="w-full max-w-72" />
        <div className="self-end">
          <h1>{person.name}</h1>
          <LifeDates
            birth={person.birth_date}
            birthPrecision={person.birth_date_precision}
            death={person.death_date}
            deathPrecision={person.death_date_precision}
            className="mt-2 text-h3"
          />
          <Place country={person.country} home={person.home} className="mt-1 text-muted" />
        </div>
      </header>

      <div className="mt-10 grid gap-12 md:grid-cols-[1fr_minmax(0,18rem)] md:gap-16">
        <div className="min-w-0 max-w-text">
          <Story text={person.story} lang={person.story_lang} />

          {albums.length > 0 && (
            <section aria-labelledby="photos-heading" className="mt-14">
              <h2 id="photos-heading">{t('photos')}</h2>
              <div className="mt-4">
                <PhotoAlbums albums={albums} />
              </div>
            </section>
          )}

          <section aria-labelledby="tributes-heading" className="mt-14">
            <h2 id="tributes-heading">{t('tributes')}</h2>
            <div className="mt-4">
              <TributeList tributes={tributes} emptyText={t('noTributes')} />
            </div>
            {formToken && (
              <div className="mt-10 border-t border-line pt-8">
                <h3 id="write">{tt('title', { name })}</h3>
                <p className="mt-2 text-muted">{tt('intro')}</p>
                <div className="mt-6">
                  <TributeForm personId={person.id} name={name} token={formToken} />
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-12">
          <section aria-labelledby="candle-heading">
            <h2 id="candle-heading" className="text-h3">
              {tc('title')}
            </h2>
            <div className="mt-3">
              {formToken ? (
                <CandleForm personId={person.id} name={name} count={person.candle_count} token={formToken} />
              ) : (
                <p>{tc('count', { count: person.candle_count, name })}</p>
              )}
            </div>
            {candles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-small font-semibold">{tc('recent')}</h3>
                <ul className="mt-2 space-y-2 text-small">
                  {candles.map((candle) => (
                    <li key={candle.id}>
                      <span className="font-semibold">{candle.author_name ?? tc('anonymous')}</span>
                      {candle.message && <span>: {candle.message}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <DonateInMemory name={name} />

          <p className="text-small">
            <Link href="/remembered">{t('backToOverview')}</Link>
          </p>
        </aside>
      </div>
    </article>
  );
}
