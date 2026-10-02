/**
 * Image paths in the database look like:
 *   media/photos/<person>/<file>.jpg   approved, served publicly
 *   uploads/tributes/<file>.jpg        waiting for moderation, never public
 *   /placeholders/portrait.svg         static files (sample data)
 *
 * Public images are served from this site's own address (/media/..., rewritten to
 * Supabase Storage in next.config.ts), so visitors' browsers only talk to one host.
 */
export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('/')) return path;
  if (path.startsWith('media/')) return `/${path}`;
  return null;
}

export function isPendingUpload(path: string | null | undefined): path is string {
  return !!path && path.startsWith('uploads/');
}

/** Splits 'bucket/rest/of/path' into its parts. */
export function splitStoragePath(path: string): { bucket: string; key: string } {
  const [bucket, ...rest] = path.split('/');
  return { bucket, key: rest.join('/') };
}
