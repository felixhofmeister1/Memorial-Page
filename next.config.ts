import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  // The foundation's own site may embed these pages; nobody else may.
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self' https://padrewassonfoundation.org https://*.padrewassonfoundation.org",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Photos are resized in the browser before upload; this is the ceiling for the rare
      // case without JavaScript. (Vercel itself caps request bodies at 4.5 MB.)
      bodySizeLimit: '9mb',
    },
  },
  async rewrites() {
    // Approved images are served from this site's own address, so visitors' browsers
    // never contact a third party.
    return supabaseUrl
      ? [{ source: '/media/:path*', destination: `${supabaseUrl}/storage/v1/object/public/media/:path*` }]
      : [];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
