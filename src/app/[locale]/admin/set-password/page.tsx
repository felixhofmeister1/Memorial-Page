import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { StatefulForm } from '@/components/admin/StatefulForm';
import { setPassword } from '@/lib/actions/admin';
import { getCurrentStaff } from '@/lib/auth';
import { Link, redirect } from '@/i18n/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Reached from an invitation or password-reset email, and from "Account" in the admin menu. */
export default async function SetPasswordPage({ params }: PageProps<'/[locale]/admin/set-password'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Admin');
  const { user } = await getCurrentStaff();
  if (!user) redirect({ href: '/admin/login', locale });

  return (
    <div className="ui mx-auto max-w-site px-gutter py-16">
      <div className="max-w-sm">
        <h1>{t('newPassword')}</h1>
        <p className="mt-2 text-muted">{user?.email}</p>
        <StatefulForm action={setPassword} submitLabel={t('setPassword')} className="mt-6" resetOnSuccess>
          <label htmlFor="password" className="label">
            {t('newPassword')}
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="field" />
        </StatefulForm>
        <p className="mt-8">
          <Link href="/admin">{t('nav.overview')}</Link>
        </p>
      </div>
    </div>
  );
}
