'use client';

import { useTranslations } from 'next-intl';

/** Shown after a form was accepted in preview mode (no database yet). */
export function PreviewNote({ show }: { show?: boolean }) {
  const t = useTranslations('Forms');
  if (!show) return null;
  return <span className="ui mt-2 block text-small not-italic text-muted">{t('previewNote')}</span>;
}
