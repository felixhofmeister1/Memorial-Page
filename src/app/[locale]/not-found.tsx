import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('NotFound');
  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <div className="max-w-text">
        <h1>{t('title')}</h1>
        <p className="mt-4">{t('text')}</p>
        <p className="mt-4">
          <Link href="/remembered">{t('link')}</Link>
        </p>
      </div>
    </div>
  );
}
