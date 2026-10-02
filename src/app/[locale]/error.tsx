'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { FOUNDATION_EMAIL } from '@/lib/site';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Forms.errors');
  const ts = useTranslations('Site');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <div className="max-w-text">
        <p role="alert">{t('server')}</p>
        <p className="mt-4 flex gap-4">
          <button type="button" className="button-quiet" onClick={reset}>
            {ts('tryAgain')}
          </button>
          <a href={`mailto:${FOUNDATION_EMAIL}`}>{FOUNDATION_EMAIL}</a>
        </p>
      </div>
    </div>
  );
}
