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
    <nav aria-label={t('language')} className="text-small">
      <ul className="flex gap-3">
        {routing.locales.map((l) => (
          <li key={l}>
            {l === locale ? (
              <span aria-current="true" className="font-semibold">
                {NAMES[l]}
              </span>
            ) : (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={{ pathname, params } as any}
                locale={l}
                lang={l}
                hrefLang={l}
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
