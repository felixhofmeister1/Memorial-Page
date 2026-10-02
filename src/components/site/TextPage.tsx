import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

/** A simple text page (About, Privacy, Legal notice). These are drafts for the foundation to replace. */
export async function TextPage({ page, children }: { page: 'about' | 'privacy' | 'impressum'; children?: ReactNode }) {
  const t = await getTranslations('Pages');
  const body = t.raw(`${page}.body`) as string[];
  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <div className="max-w-text">
        <p className="mb-6 border-l-4 border-line pl-3 text-small text-muted">{t('draftNote')}</p>
        <h1>{t(`${page}.title`)}</h1>
        <div className="prose-story mt-6">
          {body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
