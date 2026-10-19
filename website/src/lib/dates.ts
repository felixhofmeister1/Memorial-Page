/**
 * Dates that may be known only in part: often only the year someone was born is known,
 * sometimes the month. `m` and `d` are 1-based.
 */
export type PartialDate = { y: number; m?: number; d?: number };

export type DateInput = { day: string; month: string; year: string };

export type DateProblem = 'incomplete' | 'impossible' | 'future';

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Reads the three fields of a date. Empty fields are fine; a day needs a month, and anything needs a year. */
export function parseDateInput(input: DateInput, today = new Date()): { date: PartialDate | null; problem?: DateProblem } {
  const day = input.day.trim();
  const month = input.month.trim();
  const year = input.year.trim();
  if (!day && !month && !year) return { date: null };
  if (!year || (day && !month)) return { date: null, problem: 'incomplete' };
  const y = Number(year);
  const m = month ? Number(month) : undefined;
  const d = day ? Number(day) : undefined;
  if (!Number.isInteger(y) || y < 1850 || y > 2200) return { date: null, problem: 'impossible' };
  if (m !== undefined && (!Number.isInteger(m) || m < 1 || m > 12)) return { date: null, problem: 'impossible' };
  if (d !== undefined && (!Number.isInteger(d) || d < 1 || d > daysInMonth(y, m!))) return { date: null, problem: 'impossible' };
  const date: PartialDate = { y, ...(m ? { m } : {}), ...(d ? { d } : {}) };
  if (compareDates(date, { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() }) > 0) {
    return { date: null, problem: 'future' };
  }
  return { date };
}

export function toDateInput(date: PartialDate | null): DateInput {
  return { day: date?.d ? String(date.d) : '', month: date?.m ? String(date.m) : '', year: date ? String(date.y) : '' };
}

/** Compares as far as both dates are known: 1950 and 3 May 1950 count as equal. */
export function compareDates(a: PartialDate, b: PartialDate): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m === undefined || b.m === undefined) return 0;
  if (a.m !== b.m) return a.m - b.m;
  if (a.d === undefined || b.d === undefined) return 0;
  return a.d - b.d;
}

/** A number for sorting; unknown parts count as the start of the year or month. */
export function sortKey(date: PartialDate | null): number {
  return date ? date.y * 10000 + (date.m ?? 0) * 100 + (date.d ?? 0) : 0;
}

/** Age at death, only when it can be known: both dates need at least the month. */
export function ageAt(birth: PartialDate | null, death: PartialDate | null): number | null {
  if (!birth?.m || !death?.m) return null;
  let age = death.y - birth.y;
  if (death.m < birth.m) age -= 1;
  else if (death.m === birth.m) {
    if (!birth.d || !death.d) return null; // same month, unknown days: could be either
    if (death.d < birth.d) age -= 1;
  }
  return age >= 0 ? age : null;
}

// English dates are written day-month-year, as in the rest of the family's letters.
const intlLocale = (lang: string) => (lang === 'en' ? 'en-GB' : lang);

export function formatDate(date: PartialDate, lang: string): string {
  if (date.d && date.m) {
    return new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      Date.UTC(date.y, date.m - 1, date.d),
    );
  }
  if (date.m) {
    return new Intl.DateTimeFormat(intlLocale(lang), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(date.y, date.m - 1, 1));
  }
  return String(date.y);
}

/** "14 February" or "February": the day of an anniversary, without the year. */
export function formatDayOfYear(date: PartialDate, lang: string): string {
  const options: Intl.DateTimeFormatOptions = date.d ? { day: 'numeric', month: 'long', timeZone: 'UTC' } : { month: 'long', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(intlLocale(lang), options).format(Date.UTC(2000, (date.m ?? 1) - 1, date.d ?? 1));
}

export function formatTimestamp(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export function monthNames(lang: string): string[] {
  const format = new Intl.DateTimeFormat(intlLocale(lang), { month: 'long', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, i) => format.format(Date.UTC(2000, i, 1)));
}
