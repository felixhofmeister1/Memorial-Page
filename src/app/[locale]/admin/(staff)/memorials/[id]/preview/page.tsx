import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MemorialView } from '@/components/memorial/MemorialView';
import { Link } from '@/i18n/navigation';
import { requireStaffPage } from '@/lib/auth';
import { getMemorial, getPreviewContent } from '@/lib/data/admin';

/** Shows the page as the public will see it, also before it is published. Forms are left out. */
export default async function PreviewMemorial({ params }: PageProps<'/[locale]/admin/memorials/[id]/preview'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireStaffPage();
  const t = await getTranslations('Admin');
  const person = await getMemorial(id);
  if (!person) notFound();
  const content = await getPreviewContent(id);

  return (
    <>
      <p className="text-small">
        <Link href={`/admin/memorials/${id}`}>{t('actions.edit')}</Link> · {t(`status.${person.status}`)}
      </p>
      <div className="mt-4 border border-dashed border-line">
        <MemorialView person={person} albums={content.albums} tributes={content.tributes} candles={content.candles} />
      </div>
    </>
  );
}
