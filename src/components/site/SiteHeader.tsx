import { getTranslations } from 'next-intl/server';
import { FOUNDATION_URL, MAIN_MENU } from '@/lib/site';
import { MainMenu } from './MainMenu';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * Same header as padrewassonfoundation.org: logo on the left, LOVE / MEET / DISCOVER / SHARE.
 * The logo is a text stand-in until the real logo files are downloaded (see DESIGN.md).
 */
export async function SiteHeader() {
  const t = await getTranslations('Site');
  return (
    <header className="bg-header">
      <div className="relative mx-auto flex max-w-site items-center justify-between gap-4 px-gutter py-4">
        <a href={FOUNDATION_URL} className="no-underline" aria-label={t('foundation')}>
          {/* LOGO PLACEHOLDER: replace with /public/brand/logo.* from the main site */}
          <span className="font-heading text-h3 font-bold text-ink">{t('foundation')}</span>
        </a>
        <MainMenu sections={MAIN_MENU} labels={{ menu: t('menu') }} />
      </div>
      <div className="mx-auto flex max-w-site justify-end px-gutter pb-2">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
