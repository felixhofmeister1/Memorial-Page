'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useActionState } from 'react';
import { lightCandle } from '@/lib/actions/public';
import { initialFormState } from '@/lib/forms';
import { FormMessage, SpamGuards, TextField } from '@/components/forms/fields';
import { CandleIcon } from './CandleIcon';

type Props = { personId: string; name: string; count: number; token: string };

export function CandleForm({ personId, name, count, token }: Props) {
  const t = useTranslations('Candle');
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(lightCandle, initialFormState);
  const lit = state.status === 'success';
  const shown = lit ? count + 1 : count;

  return (
    <div>
      <p className="flex items-end gap-3">
        <CandleIcon lit={shown > 0} />
        <span aria-live="polite">{t('count', { count: shown, name })}</span>
      </p>

      {lit ? (
        <p role="status" className="mt-3">
          {state.withWords ? t('litWithWords') : t('lit')}
        </p>
      ) : (
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="personId" value={personId} />
          <SpamGuards token={token} locale={locale} />
          <FormMessage state={state} />
          <details open={!!(state.values?.author_name || state.values?.message)}>
            <summary className="cursor-pointer text-small">{t('addWords')}</summary>
            <div className="mt-3 space-y-3">
              <TextField name="author_name" label={t('authorName')} state={state} optional maxLength={80} autoComplete="name" />
              <TextField name="message" label={t('message')} hint={t('messageHint')} state={state} optional multiline rows={2} maxLength={280} />
            </div>
          </details>
          <button type="submit" className="button-quiet" disabled={pending}>
            {pending ? t('sending') : t('light')}
          </button>
        </form>
      )}
    </div>
  );
}
