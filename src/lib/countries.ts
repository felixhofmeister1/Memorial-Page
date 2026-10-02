// Countries with NPH homes. Stored as ISO 3166-1 alpha-2 codes, shown in the visitor's language.
export const NPH_COUNTRIES = ['BO', 'DO', 'SV', 'GT', 'HT', 'HN', 'MX', 'NI', 'PE'] as const;

export function countryName(code: string | null, locale: string): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function sortedCountries(codes: readonly string[], locale: string) {
  return codes
    .map((code) => ({ code, name: countryName(code, locale) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
