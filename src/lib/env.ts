import 'server-only';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required('SUPABASE_URL');
  },
  get supabaseAnonKey() {
    return required('SUPABASE_ANON_KEY');
  },
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY');
  },
  get submissionSecret() {
    // In preview mode (no database) forms save nothing, so a fixed value is harmless.
    // With a database the real secret is required.
    if (!process.env.SUBMISSION_SECRET && !process.env.SUPABASE_URL) return 'preview-mode-no-database';
    return required('SUBMISSION_SECRET');
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  },
  get donateUrl() {
    return process.env.DONATE_URL ?? 'https://padrewassonfoundation.org/donate';
  },
  get allowIndexing() {
    return process.env.ALLOW_INDEXING === 'true';
  },
  get turnstileSecret() {
    return process.env.TURNSTILE_SECRET_KEY || null;
  },
};
