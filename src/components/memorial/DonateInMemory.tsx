import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';

export async function DonateInMemory({ name }: { name: string }) {
  const t = await getTranslations('Donate');
  return (
    <section aria-labelledby="donate-heading" className="border-t border-line pt-6">
      <h2 id="donate-heading" className="text-h3 font-normal">
        {t('title', { name })}
      </h2>
      <p className="mt-3 text-[1rem] leading-relaxed text-ink/90">{t('text', { name })}</p>
      <p className="mt-5">
        <a href={env.donateUrl} className="button">
          {t('link')}
        </a>
      </p>
    </section>
  );
}
