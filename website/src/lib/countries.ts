/** The countries with NPH homes, in the order the family usually lists them. */
export const NPH_COUNTRIES = ['MX', 'HN', 'HT', 'NI', 'GT', 'SV', 'DO', 'BO', 'PE'] as const;

/** A country is stored as a two-letter code, or as written when it is another country. */
export function countryName(value: string, lang: string): string {
  if (/^[A-Z]{2}$/.test(value)) {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' }).of(value) ?? value;
    } catch {
      return value;
    }
  }
  return value;
}

export function isNphCountry(value: string): boolean {
  return (NPH_COUNTRIES as readonly string[]).includes(value);
}
