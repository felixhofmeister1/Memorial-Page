import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MemorialView } from '@/components/memorial/MemorialView';
import { getMemorialContent, getPublishedPerson } from '@/lib/data/public';
import { publicImageUrl } from '@/lib/media';
import { issueFormToken } from '@/lib/spam';

export async function generateMetadata({ params }: PageProps<'/[locale]/remembered/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  const person = await getPublishedPerson(slug);
  if (!person) return {};
  const t = await getTranslations({ locale, namespace: 'Overview' });
  const image = publicImageUrl(person.portrait_url);
  return {
    title: `${person.name} – ${t('title')}`,
    openGraph: { title: person.name, images: image && !image.endsWith('.svg') ? [image] : undefined },
  };
}

export default async function MemorialPage({ params }: PageProps<'/[locale]/remembered/[slug]'>) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  await connection(); // fresh data and a fresh form token on every visit

  const person = await getPublishedPerson(slug);
  if (!person) notFound();
  const { albums, tributes, candles } = await getMemorialContent(person.id);

  return <MemorialView person={person} albums={albums} tributes={tributes} candles={candles} formToken={issueFormToken()} />;
}
