/* eslint-disable @next/next/no-img-element -- admin thumbnails */
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ActionButton } from '@/components/admin/ActionButton';
import { StatefulForm } from '@/components/admin/StatefulForm';
import { Link } from '@/i18n/navigation';
import {
  addPhoto,
  createAlbum,
  deleteAlbum,
  deleteMemorial,
  deletePhoto,
  movePhoto,
  removePortrait,
  setPhotoHidden,
  updateAlbum,
  updateMemorial,
  updatePhoto,
  uploadPortrait,
} from '@/lib/actions/admin';
import { requireStaffPage } from '@/lib/auth';
import { NPH_COUNTRIES, sortedCountries } from '@/lib/countries';
import { getMemorial, getMemorialMedia, knownHomes, viewableImageUrl } from '@/lib/data/admin';
import { formatDateTime } from '@/lib/dates';

const STORY_LANGUAGES = ['en', 'es', 'de', 'fr', 'ht', 'pt'];

export default async function EditMemorial({ params }: PageProps<'/[locale]/admin/memorials/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const staff = await requireStaffPage();
  const t = await getTranslations('Admin');
  const person = await getMemorial(id);
  if (!person) notFound();
  const [{ albums, photos }, homes] = await Promise.all([getMemorialMedia(id), knownHomes()]);
  const countries = sortedCountries(NPH_COUNTRIES, locale);
  const portraitUrl = await viewableImageUrl(person.portrait_url);
  const photoUrls = await Promise.all(photos.map((p) => viewableImageUrl(p.thumb_path ?? p.storage_path)));
  const languages = new Intl.DisplayNames([locale], { type: 'language' });
  const isAdmin = staff.role === 'admin';

  const blockers = [
    !person.consent_confirmed ? t('memorials.publishBlockedConsent') : null,
    person.minor && !person.minor_confirmed_at ? t('memorials.publishBlockedMinor') : null,
  ].filter(Boolean);

  const precisionSelect = (name: string, value: string) => (
    <select name={name} defaultValue={value} className="field" aria-label={t('memorials.precision')}>
      <option value="day">{t('memorials.precisionDay')}</option>
      <option value="month">{t('memorials.precisionMonth')}</option>
      <option value="year">{t('memorials.precisionYear')}</option>
    </select>
  );

  return (
    <>
      <p className="text-small">
        <Link href="/admin/memorials">{t('nav.memorials')}</Link>
      </p>
      <h1 className="mt-2">{person.name}</h1>
      <p className="mt-2 flex flex-wrap gap-x-4 text-small">
        <span>{t(`status.${person.status}`)}</span>
        {person.sample && <span className="text-muted">{t('memorials.sample')}</span>}
        <Link href={`/admin/memorials/${id}/preview`}>{t('actions.preview')}</Link>
        {person.status === 'published' && <Link href={`/remembered/${person.slug}`}>{t('actions.view')}</Link>}
      </p>

      {/* Details and publishing ------------------------------------------------ */}
      <StatefulForm action={updateMemorial.bind(null, id)} submitLabel={t('actions.save')} className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="name">{t('memorials.name')}</label>
            <input id="name" name="name" defaultValue={person.name} required maxLength={200} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="known_as">{t('memorials.knownAs')}</label>
            <span className="hint" id="known-as-hint">{t('memorials.knownAsHint')}</span>
            <input id="known_as" name="known_as" defaultValue={person.known_as ?? ''} maxLength={60} aria-describedby="known-as-hint" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="slug">{t('memorials.slug')}</label>
            <span className="hint" id="slug-hint">{t('memorials.slugHint')}</span>
            <input id="slug" name="slug" defaultValue={person.slug} required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" aria-describedby="slug-hint" className="field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="label">{t('memorials.birthDate')}</legend>
              <div className="flex gap-2">
                <input type="date" name="birth_date" defaultValue={person.birth_date ?? ''} className="field" aria-label={t('memorials.birthDate')} />
                {precisionSelect('birth_date_precision', person.birth_date_precision)}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">{t('memorials.deathDate')}</legend>
              <div className="flex gap-2">
                <input type="date" name="death_date" defaultValue={person.death_date ?? ''} className="field" aria-label={t('memorials.deathDate')} />
                {precisionSelect('death_date_precision', person.death_date_precision)}
              </div>
            </fieldset>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="country">{t('memorials.country')}</label>
              <select id="country" name="country" defaultValue={person.country ?? ''} className="field">
                <option value="">–</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="home">{t('memorials.home')}</label>
              <input id="home" name="home" list="homes" defaultValue={person.home ?? ''} maxLength={200} className="field" />
              <datalist id="homes">
                {homes.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="story">{t('memorials.story')}</label>
            <span className="hint" id="story-hint">{t('memorials.storyHint')}</span>
            <textarea id="story" name="story" rows={16} defaultValue={person.story ?? ''} maxLength={40000} aria-describedby="story-hint" className="field" />
          </div>
          <div className="max-w-xs">
            <label className="label" htmlFor="story_lang">{t('memorials.storyLang')}</label>
            <select id="story_lang" name="story_lang" defaultValue={person.story_lang ?? ''} className="field">
              <option value="">–</option>
              {STORY_LANGUAGES.map((l) => (
                <option key={l} value={l}>{languages.of(l)}</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="space-y-4 self-start border border-line p-4">
          <legend className="px-1 font-semibold">{t('memorials.status')}</legend>
          <select name="status" defaultValue={person.status} className="field" aria-label={t('memorials.status')}>
            <option value="draft">{t('status.draft')}</option>
            <option value="pending">{t('status.pending')}</option>
            <option value="published">{t('status.published')}</option>
          </select>
          {blockers.length > 0 && person.status !== 'published' && (
            <ul className="space-y-1 text-small">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          <div className="flex items-start gap-2">
            <input id="consent_confirmed" type="checkbox" name="consent_confirmed" defaultChecked={person.consent_confirmed} className="mt-1.5" />
            <label htmlFor="consent_confirmed">{t('memorials.consentConfirmed')}</label>
          </div>
          <div>
            <label className="label" htmlFor="consent_note">{t('memorials.consentNote')}</label>
            <textarea id="consent_note" name="consent_note" rows={4} defaultValue={person.consent_note ?? ''} maxLength={4000} className="field" />
          </div>
          <div className="flex items-start gap-2">
            <input id="minor" type="checkbox" name="minor" defaultChecked={person.minor} className="mt-1.5" />
            <label htmlFor="minor">{t('memorials.minor')}</label>
          </div>
          {person.minor && (
            <div className="border-t border-line pt-3">
              <p className="font-semibold">{t('memorials.minorConfirmed')}</p>
              {person.minor_confirmed_at && (
                <p className="text-small text-muted">
                  {t('memorials.minorConfirmedBy', { date: formatDateTime(person.minor_confirmed_at, locale) })}
                </p>
              )}
              {isAdmin ? (
                <div className="mt-2 flex items-start gap-2">
                  <input type="hidden" name="minor_confirm_present" value="1" />
                  <input id="minor_confirm" type="checkbox" name="minor_confirm" defaultChecked={!!person.minor_confirmed_at} className="mt-1.5" />
                  <label htmlFor="minor_confirm">{t('memorials.minorConfirm')}</label>
                </div>
              ) : (
                <p className="mt-1 text-small">{t('memorials.minorAdminOnly')}</p>
              )}
            </div>
          )}
        </fieldset>
      </StatefulForm>

      {/* Portrait ------------------------------------------------------------- */}
      <section aria-labelledby="portrait-heading" className="mt-14 border-t border-line pt-8">
        <h2 id="portrait-heading">{t('memorials.portrait')}</h2>
        <div className="mt-4 flex flex-wrap items-start gap-6">
          {portraitUrl ? (
            <img src={portraitUrl} alt="" className="aspect-[3/4] w-40 object-cover" />
          ) : (
            <div className="grey-placeholder aspect-[3/4] w-40" aria-hidden="true" />
          )}
          <div className="space-y-4">
            <StatefulForm action={uploadPortrait.bind(null, id)} submitLabel={t('actions.upload')} resetOnSuccess>
              <input type="file" name="portrait" accept="image/jpeg,image/png,image/webp" required aria-label={t('memorials.portrait')} />
            </StatefulForm>
            {person.portrait_url && <ActionButton action={removePortrait.bind(null, id)} label={t('actions.remove')} />}
          </div>
        </div>
      </section>

      {/* Albums --------------------------------------------------------------- */}
      <section aria-labelledby="albums-heading" className="mt-14 border-t border-line pt-8">
        <h2 id="albums-heading">{t('memorials.albums')}</h2>
        <ul className="mt-4 space-y-4">
          {albums.map((album) => (
            <li key={album.id} className="flex flex-wrap items-end gap-3">
              <form action={updateAlbum.bind(null, album.id)} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="label" htmlFor={`album-${album.id}`}>{t('memorials.albumTitle')}</label>
                  <input id={`album-${album.id}`} name="title" defaultValue={album.title} required maxLength={200} className="field" />
                </div>
                <div>
                  <label className="label" htmlFor={`album-d-${album.id}`}>{t('memorials.albumDescription')}</label>
                  <input id={`album-d-${album.id}`} name="description" defaultValue={album.description ?? ''} maxLength={2000} className="field" />
                </div>
                <button type="submit" className="button-quiet">{t('actions.save')}</button>
              </form>
              <ActionButton action={deleteAlbum.bind(null, album.id)} label={t('actions.delete')} confirm={t('actions.confirmDelete')} />
            </li>
          ))}
        </ul>
        <form action={createAlbum.bind(null, id)} className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="new-album">{t('memorials.newAlbum')}</label>
            <input id="new-album" name="title" required maxLength={200} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="new-album-d">{t('memorials.albumDescription')}</label>
            <input id="new-album-d" name="description" maxLength={2000} className="field" />
          </div>
          <button type="submit" className="button-quiet">{t('actions.add')}</button>
        </form>
      </section>

      {/* Photos --------------------------------------------------------------- */}
      <section aria-labelledby="photos-heading" className="mt-14 border-t border-line pt-8">
        <h2 id="photos-heading">{t('memorials.photos')}</h2>
        <ul className="mt-4 divide-y divide-line">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex flex-wrap gap-4 py-4">
              {photoUrls[index] ? (
                <img src={photoUrls[index]!} alt="" className="h-28 w-28 object-cover" />
              ) : (
                <div className="grey-placeholder h-28 w-28" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-small text-muted">
                  {photo.hidden ? t('status.hidden') : t(`status.${photo.status}`)}
                </p>
                <form action={updatePhoto.bind(null, photo.id)} className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="label" htmlFor={`cap-${photo.id}`}>{t('memorials.caption')}</label>
                    <input id={`cap-${photo.id}`} name="caption" defaultValue={photo.caption ?? ''} maxLength={1000} className="field" />
                  </div>
                  <div>
                    <label className="label" htmlFor={`by-${photo.id}`}>{t('memorials.contributedBy')}</label>
                    <input id={`by-${photo.id}`} name="contributed_by" defaultValue={photo.contributed_by ?? ''} maxLength={120} className="field" />
                  </div>
                  <div>
                    <label className="label" htmlFor={`al-${photo.id}`}>{t('memorials.albums')}</label>
                    <select id={`al-${photo.id}`} name="album_id" defaultValue={photo.album_id ?? ''} className="field">
                      <option value="">{t('memorials.noAlbum')}</option>
                      {albums.map((a) => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="button-quiet">{t('actions.save')}</button>
                </form>
                <div className="flex flex-wrap gap-2">
                  <ActionButton action={movePhoto.bind(null, photo.id, -1)} label={t('actions.moveUp')} />
                  <ActionButton action={movePhoto.bind(null, photo.id, 1)} label={t('actions.moveDown')} />
                  <ActionButton action={setPhotoHidden.bind(null, photo.id, !photo.hidden)} label={photo.hidden ? t('actions.show') : t('actions.hide')} />
                  <ActionButton action={deletePhoto.bind(null, photo.id)} label={t('actions.delete')} confirm={t('actions.confirmDelete')} />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <StatefulForm action={addPhoto.bind(null, id)} submitLabel={t('actions.upload')} className="mt-6 space-y-3" resetOnSuccess>
          <h3>{t('memorials.addPhoto')}</h3>
          <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required aria-label={t('memorials.addPhoto')} />
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="label" htmlFor="new-caption">{t('memorials.caption')}</label>
              <input id="new-caption" name="caption" maxLength={1000} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="new-by">{t('memorials.contributedBy')}</label>
              <input id="new-by" name="contributed_by" maxLength={120} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="new-album-id">{t('memorials.albums')}</label>
              <select id="new-album-id" name="album_id" className="field">
                <option value="">{t('memorials.noAlbum')}</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          </div>
        </StatefulForm>
      </section>

      {isAdmin && (
        <section className="mt-14 border-t border-line pt-8">
          <ActionButton action={deleteMemorial.bind(null, id)} label={`${t('actions.delete')}: ${person.name}`} confirm={t('actions.confirmDelete')} />
        </section>
      )}
    </>
  );
}
