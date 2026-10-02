import type { DatePrecision } from '@/lib/supabase/database.types';

const OPTIONS: Record<DatePrecision, Intl.DateTimeFormatOptions> = {
  day: { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' },
  month: { month: 'long', year: 'numeric', timeZone: 'UTC' },
  year: { year: 'numeric', timeZone: 'UTC' },
};

/** Formats a date-only value ('1991-03-12') to the precision that is actually known. */
export function formatLifeDate(date: string | null, precision: DatePrecision, locale: string): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(locale, OPTIONS[precision]).format(parsed);
}

export function yearOf(date: string | null): number | null {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

export function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(
    new Date(value),
  );
}

export function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'Europe/Berlin' }).format(new Date(value));
}
