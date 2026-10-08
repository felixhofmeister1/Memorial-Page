'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useActionState } from 'react';
import { submitTribute } from '@/lib/actions/public';
import { initialFormState } from '@/lib/forms';
import { FormMessage, SpamGuards, TextField } from '@/components/forms/fields';
import { PhotoField } from '@/components/forms/PhotoField';
import { PreviewNote } from '@/components/forms/PreviewNote';

type Props = { personId: string; name: string; token: string };

export function TributeForm({ personId, name, token }: Props) {
  const t = useTranslations('Tribute');
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(submitTribute, initialFormState);

  if (state.status === 'success') {
    return (
      <p role="status" className="font-serif text-[1.1875rem] italic">
        {t('thanks')}
        <PreviewNote show={state.preview} />
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="personId" value={personId} />
      <SpamGuards token={token} locale={locale} />
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="author_name" label={t('authorName')} state={state} maxLength={120} autoComplete="name" />
        <TextField
          name="author_relation"
          label={t('authorRelation', { name })}
          hint={t('authorRelationHint')}
          state={state}
          optional
          maxLength={120}
        />
      </div>
      <TextField name="message" label={t('message')} state={state} multiline rows={7} maxLength={5000} />
      <PhotoField name="photo" label={t('photo')} hint={t('photoHint')} state={state} />
      <div className="pt-1">
        <button type="submit" className="button" disabled={pending}>
          {pending ? t('sending') : t('submit')}
        </button>
      </div>
    </form>
  );
}
