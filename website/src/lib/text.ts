/** Lowercase, without accents: "José" and "jose" find the same person. */
export function plain(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** A readable address for a page, made from the name: "Guadalupe Ramírez" -> "guadalupe-ramirez". */
export function slugify(name: string): string {
  const slug = plain(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'page';
}

/** Paragraphs from plain text: an empty line starts a new one. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function initialOf(name: string): string {
  const letter = name.trim().match(/\p{L}/u)?.[0];
  return letter ? letter.toLocaleUpperCase() : '·';
}

export function formatBytes(bytes: number, lang: string): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: unit > 1 ? 1 : 0 }).format(value)} ${units[unit]}`;
}
