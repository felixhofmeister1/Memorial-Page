import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { StatefulForm } from '@/components/admin/StatefulForm';
import { sendPasswordReset, signIn } from '@/lib/actions/admin';
import { getCurrentStaff } from '@/lib/auth';
import { requireDatabase } from '@/lib/mode';
import { redirect } from '@/i18n/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LoginPage({ params, searchParams }: PageProps<'/[locale]/admin/login'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  requireDatabase(); // sign-in only exists once there is a database
  const t = await getTranslations('Admin');
  const query = await searchParams;
  const { user, staff } = await getCurrentStaff();
  if (staff) redirect({ href: '/admin', locale });

  return (
    <div className="ui mx-auto max-w-site px-gutter py-16">
      <div className="max-w-sm">
        <h1>{t('title')}</h1>
        {(query.not === 'staff' || (user && !staff)) && (
          <p role="alert" className="mt-4">
            {t('notStaff')}
          </p>
        )}
        {query.link === 'invalid' && (
          <p role="alert" className="mt-4">
            {t('errors.generic')}
          </p>
        )}
        <StatefulForm action={signIn} submitLabel={t('signIn')} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">
              {t('email')}
            </label>
            <input id="email" name="email" type="email" autoComplete="username" required className="field" />
          </div>
          <div>
            <label htmlFor="password" className="label">
              {t('password')}
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
          </div>
        </StatefulForm>

        <details className="mt-10">
          <summary className="cursor-pointer">{t('forgotPassword')}</summary>
          <StatefulForm action={sendPasswordReset} submitLabel={t('sendResetLink')} className="mt-4">
            <label htmlFor="reset-email" className="label">
              {t('email')}
            </label>
            <input id="reset-email" name="email" type="email" autoComplete="username" required className="field" />
          </StatefulForm>
        </details>
      </div>
    </div>
  );
}
