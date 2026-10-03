import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FOUNDATION_EMAIL, FOUNDATION_URL } from '@/lib/site';

/**
 * Footer. Interim design; to be matched to the footer of padrewassonfoundation.org
 * once it can be studied (see DESIGN.md).
 */
export async function SiteFooter() {
  const t = await getTranslations('Site');
  const to = await getTranslations('Overview');
  const linkClass = 'text-footer-ink no-underline hover:underline';

  return (
    <footer className="mt-24 border-t border-line bg-footer text-footer-ink">
      <div className="ui mx-auto grid max-w-site gap-10 px-gutter py-14 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p aria-hidden="true" className="font-serif text-[1.375rem] leading-none">
            Padre Wasson
          </p>
          <p aria-hidden="true" className="eyebrow mt-1.5 tracking-[0.32em] text-ink/70">
            Foundation
          </p>
          <p className="sr-only">{t('foundation')}</p>
          <p className="mt-5 text-[0.9375rem]">
            <a href={`mailto:${FOUNDATION_EMAIL}`} className={linkClass}>
              {FOUNDATION_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-[0.9375rem]">
            <a href={FOUNDATION_URL} className={linkClass}>
              {t('mainSite')}
            </a>
          </p>
        </div>

        <nav aria-label={t('remembered')}>
          <p className="eyebrow">{t('remembered')}</p>
          <ul className="mt-4 space-y-2 text-[0.9375rem]">
            <li>
              <Link href="/remembered" className={linkClass}>
                {to('peopleHeading')}
              </Link>
            </li>
            <li>
              <Link href="/remembered/request" className={linkClass}>
                {to('requestLink')}
              </Link>
            </li>
            <li>
              <Link href="/about-this-memorial" className={linkClass}>
                {t('aboutMemorial')}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={t('legalNotice')}>
          <p className="eyebrow">{t('legal')}</p>
          <ul className="mt-4 space-y-2 text-[0.9375rem]">
            <li>
              <Link href="/privacy" className={linkClass}>
                {t('privacy')}
              </Link>
            </li>
            <li>
              <Link href="/impressum" className={linkClass}>
                {t('legalNotice')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="ui mx-auto max-w-site px-gutter py-5 text-small text-muted">{t('noTracking')}</p>
      </div>
    </footer>
  );
}
