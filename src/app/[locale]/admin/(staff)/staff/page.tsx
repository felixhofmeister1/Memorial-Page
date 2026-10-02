import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ActionButton } from '@/components/admin/ActionButton';
import { StatefulForm } from '@/components/admin/StatefulForm';
import { redirect } from '@/i18n/navigation';
import { changeStaffRole, inviteStaff, removeStaff } from '@/lib/actions/admin';
import { requireStaffPage } from '@/lib/auth';
import { listStaff } from '@/lib/data/admin';

export default async function StaffAdmin({ params }: PageProps<'/[locale]/admin/staff'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await requireStaffPage();
  if (me.role !== 'admin') redirect({ href: '/admin', locale });
  const t = await getTranslations('Admin');
  const staff = await listStaff();
  const admins = staff.filter((s) => s.role === 'admin').length;

  return (
    <>
      <h1>{t('nav.staff')}</h1>
      <p className="mt-2 max-w-text">{t('staff.intro')}</p>

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {staff.map((s) => {
          const lastAdmin = s.role === 'admin' && admins <= 1;
          return (
            <li key={s.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                {s.email}
                {s.user_id === me.userId && <span className="text-muted"> ({t('staff.you')})</span>}
                <span className="block text-small text-muted">{t(`role.${s.role}`)}</span>
              </span>
              {lastAdmin ? (
                <span className="text-small text-muted">{t('staff.lastAdmin')}</span>
              ) : (
                <span className="flex gap-2">
                  <ActionButton
                    action={changeStaffRole.bind(null, s.user_id, s.role === 'admin' ? 'editor' : 'admin')}
                    label={s.role === 'admin' ? t('staff.makeEditor') : t('staff.makeAdmin')}
                  />
                  <ActionButton action={removeStaff.bind(null, s.user_id)} label={t('actions.remove')} confirm={t('actions.confirmDelete')} />
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <StatefulForm action={inviteStaff} submitLabel={t('staff.invite')} className="mt-10 max-w-md space-y-3" resetOnSuccess>
        <h2 className="text-h3">{t('staff.invite')}</h2>
        <label className="label" htmlFor="invite-email">{t('email')}</label>
        <input id="invite-email" name="email" type="email" required className="field" />
        <label className="label" htmlFor="invite-role">{t('staff.role')}</label>
        <select id="invite-role" name="role" defaultValue="editor" className="field">
          <option value="editor">{t('role.editor')}</option>
          <option value="admin">{t('role.admin')}</option>
        </select>
      </StatefulForm>
    </>
  );
}
