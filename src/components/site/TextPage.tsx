import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

/** A simple text page (About, Privacy, Legal notice). These are drafts for the foundation to replace. */
export async function TextPage({ page, children }: { page: 'about' | 'privacy' | 'impressum'; children?: ReactNode }) {
  const t = await getTranslations('Pages');
  const body = t.raw(`${page}.body`) as string[];
  return (
    <div className="mx-auto max-w-site px-gutter pt-12 md:pt-20">
      <div className="mx-auto max-w-text">
        <p className="ui mb-8 inline-block bg-paper-deep px-3 py-1.5 text-small text-muted">{t('draftNote')}</p>
        <h1>{t(`${page}.title`)}</h1>
        <div className="prose-story mt-10">
          {body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
