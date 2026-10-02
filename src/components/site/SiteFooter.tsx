import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FOUNDATION_EMAIL, FOUNDATION_URL } from '@/lib/site';

/**
 * Footer. STRUCTURE PENDING: must be rebuilt to match the footer of
 * padrewassonfoundation.org once it can be studied (see DESIGN.md).
 */
export async function SiteFooter() {
  const t = await getTranslations('Site');
  return (
    <footer className="mt-16 bg-footer text-footer-ink">
      <div className="mx-auto flex max-w-site flex-col gap-4 px-gutter py-8 text-small md:flex-row md:justify-between">
        <div>
          <p className="font-semibold">{t('foundation')}</p>
          <p>
            <a href={`mailto:${FOUNDATION_EMAIL}`}>{FOUNDATION_EMAIL}</a>
          </p>
          <p>
            <a href={FOUNDATION_URL}>{t('mainSite')}</a>
          </p>
        </div>
        <ul className="flex flex-col gap-1 md:items-end">
          <li>
            <Link href="/about-this-memorial">{t('aboutMemorial')}</Link>
          </li>
          <li>
            <Link href="/privacy">{t('privacy')}</Link>
          </li>
          <li>
            <Link href="/impressum">{t('legalNotice')}</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
