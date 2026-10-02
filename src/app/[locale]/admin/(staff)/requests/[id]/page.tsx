/* eslint-disable @next/next/no-img-element -- admin view of an uploaded photo */
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ActionButton } from '@/components/admin/ActionButton';
import { StatefulForm } from '@/components/admin/StatefulForm';
import { Story } from '@/components/memorial/Story';
import { Link } from '@/i18n/navigation';
import { createMemorialFromRequest, updateRequest } from '@/lib/actions/admin';
import { requireStaffPage } from '@/lib/auth';
import { countryName } from '@/lib/countries';
import { getRequest, viewableImageUrl } from '@/lib/data/admin';
import { formatDateTime } from '@/lib/dates';

export default async function RequestDetail({ params }: PageProps<'/[locale]/admin/requests/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireStaffPage();
  const t = await getTranslations('Admin');
  const tr = await getTranslations('Request');
  const request = await getRequest(id);
  if (!request) notFound();
  const photo = await viewableImageUrl(request.photo_path);
  const yesNo = (v: boolean) => (v ? t('requests.yes') : t('requests.no'));

  const rows: Array<[string, string | null]> = [
    [tr('birthDate'), request.birth_date],
    [tr('deathDate'), request.death_date],
    [tr('country'), countryName(request.country, locale)],
    [tr('home'), request.home],
    [t('requests.isMinor'), yesNo(request.is_minor)],
    [t('requests.familyInformed'), yesNo(request.family_informed)],
  ];

  return (
    <>
      <p className="text-small">
        <Link href="/admin/requests">{t('nav.requests')}</Link>
      </p>
      <h1 className="mt-2">{request.person_name}</h1>
      <p className="mt-1 text-small text-muted">{t('requests.received', { date: formatDateTime(request.created_at, locale) })}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-semibold">{label}</dt>
                <dd>{value ?? '–'}</dd>
              </div>
            ))}
          </dl>
          {request.story && <Story text={request.story} className="max-w-text" />}
          {photo && <img src={photo} alt="" className="max-h-80 w-auto" />}
        </div>

        <aside className="space-y-8">
          <section>
            <h2 className="text-h3">{t('requests.from')}</h2>
            <p className="mt-2">{request.requester_name}</p>
            <p className="text-muted">{request.requester_relation}</p>
            <p className="mt-2">
              <a href={`mailto:${request.requester_email}`}>{request.requester_email}</a>
            </p>
            {request.requester_phone && <p>{request.requester_phone}</p>}
          </section>

          <StatefulForm action={updateRequest.bind(null, id)} submitLabel={t('actions.save')} className="space-y-3">
            <label className="label" htmlFor="status">{t('memorials.status')}</label>
            <select id="status" name="status" defaultValue={request.status} className="field">
              {(['new', 'in_progress', 'accepted', 'declined'] as const).map((s) => (
                <option key={s} value={s}>{t(`status.${s}`)}</option>
              ))}
            </select>
            <label className="label" htmlFor="staff_note">{t('requests.staffNote')}</label>
            <textarea id="staff_note" name="staff_note" rows={4} defaultValue={request.staff_note ?? ''} maxLength={4000} className="field" />
          </StatefulForm>

          {request.person_id ? (
            <Link href={`/admin/memorials/${request.person_id}`}>{t('requests.openMemorial')}</Link>
          ) : (
            <ActionButton action={createMemorialFromRequest.bind(null, id)} label={t('requests.createMemorial')} quiet={false} />
          )}
        </aside>
      </div>
    </>
  );
}
