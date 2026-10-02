import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RequestForm } from '@/components/forms/RequestForm';
import { NPH_COUNTRIES, sortedCountries } from '@/lib/countries';
import { issueFormToken } from '@/lib/spam';

export async function generateMetadata({ params }: PageProps<'/[locale]/remembered/request'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Request' });
  return { title: t('metaTitle') };
}

export default async function RequestPage({ params }: PageProps<'/[locale]/remembered/request'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations('Request');

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <div className="max-w-text">
        <h1>{t('title')}</h1>
        <p className="mt-6">{t('greeting')}</p>
        <p className="mt-2">{t('intro')}</p>
        <p className="mt-4">{t('consentNote')}</p>
        <RequestForm token={issueFormToken()} countries={sortedCountries(NPH_COUNTRIES, locale)} />
      </div>
    </div>
  );
}
