import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { de } from './de';
import { en, type Messages } from './en';
import { es } from './es';

export type Lang = 'en' | 'de' | 'es';
// Spanish first: it is the language of most of the family.
export const LANGS: { code: Lang; name: string }[] = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
];

export const MESSAGES: Record<Lang, Messages> = { en, de, es };

const STORAGE_KEY = 'remembered-lang';

/** The language chosen last time on this browser, else Spanish. */
export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'de' || saved === 'es') return saved;
  } catch {
    // storage may be blocked; fall through
  }
  return 'es';
}

export function rememberLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // not important
  }
}

export type I18n = { lang: Lang; t: Messages; setLang: (lang: Lang) => void };

export const I18nContext = createContext<I18n>({ lang: 'en', t: en, setLang: () => undefined });

export const useI18n = () => useContext(I18nContext);
