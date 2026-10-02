import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TextPage } from '@/components/site/TextPage';
import { FOUNDATION_IMPRESSUM_URL } from '@/lib/site';

export async function generateMetadata({ params }: PageProps<'/[locale]/impressum'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Pages' });
  return { title: t('impressum.metaTitle') };
}

export default async function ImpressumPage({ params }: PageProps<'/[locale]/impressum'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Pages');
  return (
    <TextPage page="impressum">
      <p className="mt-4">
        <a href={FOUNDATION_IMPRESSUM_URL}>{t('impressum.link')}</a>
      </p>
    </TextPage>
  );
}
