import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { shortName, type PublicAlbum, type PublicCandle, type PublicPerson, type PublicTribute } from '@/lib/data/public';
import { CandleForm } from './CandleForm';
import { CandleIcon } from './CandleIcon';
import { DonateInMemory } from './DonateInMemory';
import { LifeDates } from './LifeDates';
import { PhotoAlbums } from './PhotoAlbums';
import { Place } from './Place';
import { initialOf, Portrait } from './Portrait';
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

/**
 * One memorial page, laid out like a page in a memorial book: portrait beside the name,
 * the story in a reading column, the candle and the gift at its side.
 * Used for the public page and for the admin preview.
 */
export async function MemorialView({ person, albums, tributes, candles, formToken }: Props) {
  const t = await getTranslations('Memorial');
  const tp = await getTranslations('Person');
  const tc = await getTranslations('Candle');
  const tt = await getTranslations('Tribute');
  const name = shortName(person);

  return (
    <article>
      {person.sample && (
        <p className="ui border-b border-line bg-paper-deep px-gutter py-2.5 text-center text-small text-muted">{tp('sample')}</p>
      )}

      {/* Name, dates, place ------------------------------------------------------ */}
      <header className="mx-auto max-w-site px-gutter pt-8 md:pt-12">
        <p className="ui no-print text-small">
          <Link href="/remembered" className="text-muted no-underline hover:text-ink hover:underline">
            <span aria-hidden="true">← </span>
            {t('backToOverview')}
          </Link>
        </p>
        <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-[minmax(0,20rem)_1fr] md:items-end md:gap-14 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <Portrait path={person.portrait_url} name={person.name} initial={initialOf(person)} className="print w-full max-w-[15rem] md:max-w-[22rem]" />
          <div className="md:pb-3">
            <p className="eyebrow">{tp('inMemory')}</p>
            <h1 className="mt-4">{person.name}</h1>
            <LifeDates
              birth={person.birth_date}
              birthPrecision={person.birth_date_precision}
              death={person.death_date}
              deathPrecision={person.death_date_precision}
              className="mt-5 text-[1.375rem] italic"
            />
            <Place country={person.country} home={person.home} className="ui mt-2 text-muted" />
            {formToken && (
              <p className="ui mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.9375rem]">
                <a href="#candle" className="inline-flex items-center gap-2 no-underline hover:underline">
                  <CandleIcon lit={person.candle_count > 0} size="small" className="text-ink" />
                  {tc('light')}
                </a>
                <a href="#write" className="no-underline hover:underline">
                  {t('writeSomething')}
                </a>
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="memorial-body mx-auto mt-14 grid max-w-site gap-x-16 gap-y-16 px-gutter md:mt-20 md:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Story ------------------------------------------------------------------ */}
        <div className="min-w-0">
          <Story text={person.story} lang={person.story_lang} className="max-w-text" />
        </div>

        {/* Candle (beside the story on wide screens, right after it on phones) ----- */}
        <aside id="candle" aria-labelledby="candle-heading" className="scroll-mt-6 md:col-start-2 md:row-start-1">
          <div className="panel p-6 md:sticky md:top-6">
            <h2 id="candle-heading" className="eyebrow">
              {tc('title')}
            </h2>
            <div className="mt-5">
              {formToken ? (
                <CandleForm personId={person.id} name={name} count={person.candle_count} token={formToken} />
              ) : (
                <div className="flex items-end gap-4">
                  <CandleIcon lit={person.candle_count > 0} className="text-ink" />
                  <p className="pb-1 font-serif text-[1.1875rem]">{tc('count', { count: person.candle_count, name })}</p>
                </div>
              )}
            </div>
            {candles.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="ui text-small font-semibold text-muted">{tc('recent')}</h3>
                <ul className="mt-3 space-y-3">
                  {candles.map((candle) => (
                    <li key={candle.id} className="text-[0.9375rem] leading-snug">
                      {candle.message && <span className="block italic">{candle.message}</span>}
                      <span className="ui block text-small text-muted">— {candle.author_name ?? tc('anonymous')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* Photos ------------------------------------------------------------------ */}
        {albums.length > 0 && (
          <section aria-labelledby="photos-heading" className="min-w-0 md:col-start-1">
            <h2 id="photos-heading">{t('photos')}</h2>
            <div className="mt-8">
              <PhotoAlbums albums={albums} />
            </div>
          </section>
        )}

        {/* Tributes ---------------------------------------------------------------- */}
        <section aria-labelledby="tributes-heading" className="min-w-0 md:col-start-1">
          <h2 id="tributes-heading">{t('tributes')}</h2>
          <div className="mt-8 max-w-wide-text">
            <TributeList tributes={tributes} emptyText={t('noTributes')} />
          </div>
          {formToken && (
            <div id="write" className="panel mt-12 max-w-wide-text scroll-mt-6 p-6 md:p-9">
              <h3 className="font-serif text-h2 font-normal">{tt('title', { name })}</h3>
              <p className="mt-3 max-w-text text-ink/85">{tt('intro')}</p>
              <div className="mt-8">
                <TributeForm personId={person.id} name={name} token={formToken} />
              </div>
            </div>
          )}
        </section>

        {/* Give in their memory ----------------------------------------------------- */}
        <aside className="md:col-start-2 md:row-start-2 md:self-start">
          <DonateInMemory name={name} />
        </aside>
      </div>
    </article>
  );
}
