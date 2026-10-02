import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';

export async function DonateInMemory({ name }: { name: string }) {
  const t = await getTranslations('Donate');
  return (
    <section aria-labelledby="donate-heading">
      <h2 id="donate-heading">{t('title', { name })}</h2>
      <p className="mt-2">{t('text', { name })}</p>
      <p className="mt-3">
        <a href={env.donateUrl} className="button">
          {t('link')}
        </a>
      </p>
    </section>
  );
}
