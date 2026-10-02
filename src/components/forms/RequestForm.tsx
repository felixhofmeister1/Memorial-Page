'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useId } from 'react';
import { Link } from '@/i18n/navigation';
import { requestMemorial } from '@/lib/actions/public';
import { initialFormState } from '@/lib/forms';
import { CheckboxField, FormMessage, SpamGuards, TextField } from './fields';
import { PhotoField } from './PhotoField';

type Props = { token: string; countries: { code: string; name: string }[] };

export function RequestForm({ token, countries }: Props) {
  const t = useTranslations('Request');
  const tt = useTranslations('Tribute');
  const locale = useLocale();
  const countryId = useId();
  const [state, formAction, pending] = useActionState(requestMemorial, initialFormState);

  if (state.status === 'success') {
    return (
      <p role="status" className="mt-8">
        {t('thanks')}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <SpamGuards token={token} locale={locale} />
      <FormMessage state={state} />

      <fieldset className="space-y-4">
        <legend className="text-h3 font-semibold">{t('aboutYou')}</legend>
        <TextField name="requester_name" label={t('requesterName')} state={state} maxLength={120} autoComplete="name" />
        <TextField name="requester_email" label={t('requesterEmail')} state={state} type="email" maxLength={254} autoComplete="email" />
        <TextField name="requester_phone" label={t('requesterPhone')} state={state} type="tel" optional maxLength={40} autoComplete="tel" />
        <TextField
          name="requester_relation"
          label={t('requesterRelation')}
          hint={t('requesterRelationHint')}
          state={state}
          maxLength={200}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-h3 font-semibold">{t('aboutThem')}</legend>
        <TextField name="person_name" label={t('personName')} state={state} maxLength={200} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="birth_date" label={t('birthDate')} hint={t('dateHint')} state={state} optional maxLength={60} />
          <TextField name="death_date" label={t('deathDate')} hint={t('dateHint')} state={state} optional maxLength={60} />
        </div>
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
        <TextField name="story" label={t('story')} hint={t('storyHint')} state={state} optional multiline rows={8} maxLength={20000} />
        <PhotoField name="photo" label={t('photo')} hint={tt('photoHint')} state={state} />
        <CheckboxField name="is_minor" label={t('isMinor')} state={state} />
        <CheckboxField name="family_informed" label={t('familyInformed')} state={state} />
      </fieldset>

      <p className="text-small">
        <Link href="/privacy">{t('privacyLink')}</Link>
      </p>
      <button type="submit" className="button" disabled={pending}>
        {pending ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
