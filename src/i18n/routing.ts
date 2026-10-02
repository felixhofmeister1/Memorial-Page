import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de', 'es'],
  defaultLocale: 'en',
  // English lives at /remembered/..., German at /de/remembered/..., Spanish at /es/remembered/...
  localePrefix: 'as-needed',
  // No cookies for visitors. The language comes from the address only;
  // shared links keep their language (/es/remembered/...).
  localeCookie: false,
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
