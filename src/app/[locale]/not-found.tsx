import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('NotFound');
  return (
    <div className="mx-auto max-w-site px-gutter pt-16 md:pt-24">
      <div className="mx-auto max-w-text text-center">
        <h1>{t('title')}</h1>
        <p className="lede mt-6 text-ink/85">{t('text')}</p>
        <p className="ui mt-8">
          <Link href="/remembered">{t('link')}</Link>
        </p>
      </div>
    </div>
  );
}
