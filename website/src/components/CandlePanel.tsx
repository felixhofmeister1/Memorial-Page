import { useState } from 'preact/hooks';
import { deleteCandle, lightCandle } from '../data/store';
import type { Candle as CandleRow } from '../data/types';
import { useI18n } from '../i18n';
import { formatTimestamp } from '../lib/dates';
import { confirmAction, toast } from '../lib/feedback';
import { Candle } from './Candle';

/** The one place on a page that may feel a little special. */
export function CandlePanel({ personId, callName, candles }: { personId: string; callName: string; candles: CandleRow[] }) {
  const { t, lang } = useI18n();
  const [name, setName] = useState('');
  const [words, setWords] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [justLit, setJustLit] = useState(false);
  const withWords = candles.filter((c) => c.name || c.message);

  const light = async (event: Event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await lightCandle(personId, name, words);
      setWords('');
      setJustLit(true);
      toast(t.candle.lit);
    } catch {
      toast(t.common.error, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="candle" class="panel candle-panel" aria-labelledby="candle-heading" tabIndex={-1}>
      <h2 id="candle-heading" class="eyebrow">
        {t.candle.title}
      </h2>
      <div class="candle-stage">
        <Candle lit={candles.length > 0} size="large" class={justLit ? 'just-lit' : ''} />
        <p class="candle-count" aria-live="polite">
          {candles.length === 0 ? t.candle.none : t.candle.count(candles.length, callName)}
        </p>
      </div>
      <form onSubmit={light} class="candle-form no-print" noValidate>
        <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary>{t.candle.addWords}</summary>
          <div class="candle-fields">
            <div>
              <label class="label" for="candle-name">
                {t.candle.name} <span class="optional">{t.common.optional}</span>
              </label>
              <input id="candle-name" class="field" value={name} maxLength={80} autoComplete="name" onInput={(e) => setName(e.currentTarget.value)} />
            </div>
            <div>
              <label class="label" for="candle-words">
                {t.candle.words} <span class="optional">{t.common.optional}</span>
              </label>
              <textarea id="candle-words" class="field" rows={2} value={words} maxLength={280} onInput={(e) => setWords(e.currentTarget.value)} />
            </div>
          </div>
        </details>
        <button type="submit" class="button button-candle" disabled={busy}>
          {t.candle.light}
        </button>
      </form>
      {withWords.length > 0 && (
        <div class="candle-words">
          <h3 class="small-heading">{t.candle.recent}</h3>
          <ul>
            {withWords.slice(0, 20).map((c) => (
              <li key={c.id}>
                {c.message && <p class="candle-message">{c.message}</p>}
                <p class="candle-by">
                  — {c.name || t.candle.someone}
                  <span class="candle-date"> · {formatTimestamp(c.createdAt, lang)}</span>
                  <button
                    type="button"
                    class="link-button no-print"
                    onClick={async () => {
                      if (!(await confirmAction({ title: t.candle.confirmTitle, confirm: t.common.remove, danger: true }))) return;
                      await deleteCandle(c.id);
                      toast(t.candle.removed);
                    }}
                  >
                    {t.common.remove}
                  </button>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
