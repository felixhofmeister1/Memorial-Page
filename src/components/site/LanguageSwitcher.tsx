'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const NAMES: Record<string, string> = { en: 'English', de: 'Deutsch', es: 'Español' };

export function LanguageSwitcher() {
  const t = useTranslations('Site');
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();

  return (
    <nav aria-label={t('language')} className="text-[0.8125rem]">
      <ul className="flex items-center">
        {routing.locales.map((l, i) => (
          <li key={l} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="px-2 text-line">
                |
              </span>
            )}
            {l === locale ? (
              <span aria-current="true" className="font-semibold text-ink">
                {NAMES[l]}
              </span>
            ) : (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={{ pathname, params } as any}
                locale={l}
                lang={l}
                hrefLang={l}
                className="text-muted no-underline hover:text-ink hover:underline"
              >
                {NAMES[l]}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
