'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useId } from 'react';
import { Link } from '@/i18n/navigation';
import { requestMemorial } from '@/lib/actions/public';
import { initialFormState } from '@/lib/forms';
import { CheckboxField, FormMessage, SpamGuards, TextField } from './fields';
import { PhotoField } from './PhotoField';
import { PreviewNote } from './PreviewNote';

type Props = { token: string; countries: { code: string; name: string }[] };

export function RequestForm({ token, countries }: Props) {
  const t = useTranslations('Request');
  const tt = useTranslations('Tribute');
  const locale = useLocale();
  const countryId = useId();
  const [state, formAction, pending] = useActionState(requestMemorial, initialFormState);

  if (state.status === 'success') {
    return (
      <p role="status" className="panel mt-12 p-8 font-serif text-[1.25rem] italic">
        {t('thanks')}
        <PreviewNote show={state.preview} />
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-14 space-y-12">
      <SpamGuards token={token} locale={locale} />
      <FormMessage state={state} />

      <div className="border-t border-line pt-8">
      <fieldset className="space-y-5">
        <legend className="eyebrow mb-5">{t('aboutYou')}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="requester_name" label={t('requesterName')} state={state} maxLength={120} autoComplete="name" />
        <TextField name="requester_email" label={t('requesterEmail')} state={state} type="email" maxLength={254} autoComplete="email" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="requester_phone" label={t('requesterPhone')} state={state} type="tel" optional maxLength={40} autoComplete="tel" />
        <TextField
          name="requester_relation"
          label={t('requesterRelation')}
          hint={t('requesterRelationHint')}
          state={state}
          maxLength={200}
        />
        </div>
      </fieldset>
      </div>

      <div className="border-t border-line pt-8">
      <fieldset className="space-y-5">
        <legend className="eyebrow mb-5">{t('aboutThem')}</legend>
        <TextField name="person_name" label={t('personName')} state={state} maxLength={200} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="birth_date" label={t('birthDate')} hint={t('dateHint')} state={state} optional maxLength={60} />
          <TextField name="death_date" label={t('deathDate')} hint={t('dateHint')} state={state} optional maxLength={60} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={countryId} className="label">
            {t('country')} <span className="font-normal text-muted">({tt('optional')})</span>
          </label>
          <select id={countryId} name="country" className="field" defaultValue={state.values?.country ?? ''}>
            <option value="">{t('chooseCountry')}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
            <option value="other">{t('otherCountry')}</option>
          </select>
        </div>
        <TextField name="home" label={t('home')} state={state} optional maxLength={200} />
        </div>
        <TextField name="story" label={t('story')} hint={t('storyHint')} state={state} optional multiline rows={8} maxLength={20000} />
        <PhotoField name="photo" label={t('photo')} hint={tt('photoHint')} state={state} />
        <div className="space-y-3 pt-2">
          <CheckboxField name="is_minor" label={t('isMinor')} state={state} />
          <CheckboxField name="family_informed" label={t('familyInformed')} state={state} />
        </div>
      </fieldset>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-8">
        <button type="submit" className="button" disabled={pending}>
          {pending ? t('sending') : t('submit')}
        </button>
        <Link href="/privacy" className="ui text-[0.9375rem]">
          {t('privacyLink')}
        </Link>
      </div>
    </form>
  );
}
