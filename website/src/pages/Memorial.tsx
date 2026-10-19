import { useEffect } from 'preact/hooks';
import { Candle } from '../components/Candle';
import { CandlePanel } from '../components/CandlePanel';
import { LifeDates, Place } from '../components/LifeDates';
import { PhotoAlbums } from '../components/PhotoAlbums';
import { Portrait } from '../components/Portrait';
import { Tributes } from '../components/Tributes';
import { useLive } from '../data/hooks';
import { getMemorialContent, getPersonBySlug } from '../data/store';
import { useI18n } from '../i18n';
import { ageAt } from '../lib/dates';
import { href, personPath } from '../lib/router';
import { paragraphs } from '../lib/text';
import { NotFound } from './NotFound';

/** Moves to a part of the page and puts the keyboard focus there. */
function jumpTo(id: string, focusSelector?: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  const focus = (focusSelector && target.querySelector<HTMLElement>(focusSelector)) || target;
  focus.focus({ preventScroll: true });
}

export function Memorial({ slug }: { slug: string }) {
  const { t } = useI18n();
  const { data, error } = useLive(async () => {
    const person = await getPersonBySlug(slug);
    return person ? { person, content: await getMemorialContent(person.id) } : null;
  }, [slug]);

  useEffect(() => {
    if (data?.person) document.title = `${data.person.name} · ${t.site.name}`;
  }, [data?.person?.name, t]);

  if (error) return <p class="page-message">{t.common.storageError}</p>;
  if (data === undefined) return <p class="page-message" aria-busy="true">{t.common.loading}</p>;
  if (data === null) return <NotFound />;

  const { person, content } = data;
  const callName = person.knownAs || person.name.split(' ')[0];
  const age = ageAt(person.birth, person.death);
  const story = paragraphs(person.story);

  return (
    <article class="memorial">
      <p class="back-link no-print">
        <a href={href('/')}>
          <span aria-hidden="true">← </span>
          {t.person.back}
        </a>
      </p>

      <header class="memorial-head">
        <Portrait imageId={person.portraitId} name={person.name} alt={t.person.photoOf(person.name)} variant="full" class="memorial-portrait" />
        <div class="memorial-title">
          <p class="eyebrow">{t.person.inMemory}</p>
          <h1 tabIndex={-1}>{person.name}</h1>
          {person.knownAs && person.knownAs !== person.name && <p class="known-as">{person.knownAs}</p>}
          <div class="memorial-facts">
            <LifeDates birth={person.birth} death={person.death} class="memorial-dates" />
            {age !== null && <p class="memorial-age">{t.person.aged(age)}</p>}
            <Place country={person.country} home={person.home} class="memorial-place" />
          </div>
          <p class="memorial-actions no-print">
            <button type="button" class="link-button with-icon" onClick={() => jumpTo('candle', 'button[type=submit]')}>
              <Candle lit={content.candles.length > 0} />
              {t.person.lightCandle}
            </button>
            <button type="button" class="link-button" onClick={() => jumpTo('write', 'input')}>
              {t.person.write}
            </button>
            <a href={href(`${personPath(person.slug)}/edit`)}>{t.person.editPage}</a>
          </p>
        </div>
      </header>

      {/* Story first, then the candle, then photos and words. On wide screens the candle stands beside them. */}
      <div class="memorial-body">
        <section class="story" aria-label={t.edit.story}>
          {story.length > 0 ? (
            story.map((p, i) => (
              <p key={i} class={i === 0 ? 'story-first' : undefined}>
                {p}
              </p>
            ))
          ) : (
            <p class="quiet-note">
              {t.person.noStory} <a href={href(`${personPath(person.slug)}/edit`)}>{t.person.writeStory}</a>
            </p>
          )}
        </section>

        <aside class="memorial-aside">
          <CandlePanel personId={person.id} callName={callName} candles={content.candles} />
          <p class="print-link no-print">
            <button type="button" class="link-button" onClick={() => window.print()}>
              {t.person.print}
            </button>
          </p>
        </aside>

        <div class="memorial-rest">
          <PhotoAlbums albums={content.albums} photos={content.photos} personName={person.name} />
          <Tributes personId={person.id} personName={callName} tributes={content.tributes} />
        </div>
      </div>
    </article>
  );
}
