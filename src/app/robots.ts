import type { MetadataRoute } from 'next';

/** Memorial pages stay out of search engines unless the foundation sets ALLOW_INDEXING=true. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.ALLOW_INDEXING !== 'true') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/de/admin', '/es/admin', '/auth'] } };
}
