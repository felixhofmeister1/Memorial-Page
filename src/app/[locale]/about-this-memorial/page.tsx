import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TextPage } from '@/components/site/TextPage';

export async function generateMetadata({ params }: PageProps<'/[locale]/about-this-memorial'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Pages' });
  return { title: t('about.metaTitle') };
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about-this-memorial'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TextPage page="about" />;
}
