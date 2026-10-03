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
    <div className="mx-auto max-w-site px-gutter pt-12 md:pt-20">
      <div className="mx-auto max-w-wide-text">
        <h1>{t('title')}</h1>
        <div className="mt-10 space-y-4 border-l-2 border-line pl-6 md:pl-8">
          <p className="lede italic">{t('greeting')}</p>
          <p>{t('intro')}</p>
          <p>{t('consentNote')}</p>
        </div>
        <RequestForm token={issueFormToken()} countries={sortedCountries(NPH_COUNTRIES, locale)} />
      </div>
    </div>
  );
}
