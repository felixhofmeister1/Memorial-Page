import { getTranslations } from 'next-intl/server';
import { FOUNDATION_URL, MAIN_MENU } from '@/lib/site';
import { MainMenu } from './MainMenu';
import { LanguageSwitcher } from './LanguageSwitcher';

/**
 * Same structure as padrewassonfoundation.org: logo on the left, LOVE / MEET / DISCOVER / SHARE.
 * The wordmark is a typographic stand-in until the real logo files are available (see DESIGN.md).
 */
export async function SiteHeader() {
  const t = await getTranslations('Site');
  return (
    <header className="border-b border-line bg-header">
      <div className="border-b border-line/70">
        <div className="mx-auto flex max-w-site justify-end px-gutter py-1.5">
          <LanguageSwitcher />
        </div>
      </div>
      <div className="relative mx-auto flex max-w-site items-center justify-between gap-6 px-gutter py-5 md:py-6">
        <a href={FOUNDATION_URL} className="group block text-ink no-underline" aria-label={t('foundation')}>
          {/* LOGO STAND-IN: replace with /public/brand/logo.* from the main site */}
          <span aria-hidden="true" className="block font-serif text-[1.5rem] leading-none tracking-[-0.01em] md:text-[1.75rem]">
            Padre Wasson
          </span>
          <span aria-hidden="true" className="eyebrow mt-1.5 block tracking-[0.32em] text-ink/70">
            Foundation
          </span>
        </a>
        <MainMenu sections={MAIN_MENU} labels={{ menu: t('menu') }} />
      </div>
    </header>
  );
}
