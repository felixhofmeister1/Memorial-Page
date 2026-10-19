import { useEffect, useState } from 'preact/hooks';
import { DateFields } from '../components/DateFields';
import { PhotoPicker } from '../components/PhotoPicker';
import { Portrait } from '../components/Portrait';
import { useImageUrl, useLive } from '../data/hooks';
import {
  addPhotos,
  createAlbum,
  createPerson,
  deleteAlbum,
  deletePerson,
  deletePhoto,
  getMemorialContent,
  getPersonBySlug,
  listPeople,
  movePhoto,
  setPortrait,
  setPortraitImage,
  updateAlbum,
  updatePerson,
  updatePhoto,
} from '../data/store';
import type { Album, Person, Photo } from '../data/types';
import { useI18n } from '../i18n';
import { countryName, isNphCountry, NPH_COUNTRIES } from '../lib/countries';
import { compareDates, parseDateInput, toDateInput, type DateInput, type DateProblem } from '../lib/dates';
import { confirmAction, toast } from '../lib/feedback';
import { ImageError } from '../lib/images';
import { href, navigate, personPath } from '../lib/router';
import { NotFound } from './NotFound';

// ---------------------------------------------------------------------------
// About them: name, dates, places, story
// ---------------------------------------------------------------------------

type DetailsErrors = { name?: string; birth?: string; death?: string };

function DetailsForm({ person }: { person: Person | null }) {
  const { t, lang } = useI18n();
  const [name, setName] = useState(person?.name ?? '');
  const [knownAs, setKnownAs] = useState(person?.knownAs ?? '');
  const [birth, setBirth] = useState<DateInput>(toDateInput(person?.birth ?? null));
  const [death, setDeath] = useState<DateInput>(toDateInput(person?.death ?? null));
  const initialCountry = person?.country ?? '';
  const [countryChoice, setCountryChoice] = useState(initialCountry === '' || isNphCountry(initialCountry) ? initialCountry : 'other');
  const [otherCountry, setOtherCountry] = useState(initialCountry && !isNphCountry(initialCountry) ? initialCountry : '');
  const [home, setHome] = useState(person?.home ?? '');
  const [story, setStory] = useState(person?.story ?? '');
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [busy, setBusy] = useState(false);
  const { data: homes } = useLive(async () => [...new Set((await listPeople()).map((p) => p.home).filter(Boolean))].sort(), []);

  const problemText = (problem: DateProblem) =>
    problem === 'incomplete' ? t.edit.dateIncomplete : problem === 'future' ? t.edit.dateFuture : t.edit.dateImpossible;

  const submit = async (event: Event) => {
    event.preventDefault();
    const b = parseDateInput(birth);
    const d = parseDateInput(death);
    const next: DetailsErrors = {};
    if (!name.trim()) next.name = t.edit.nameRequired;
    if (b.problem) next.birth = problemText(b.problem);
    if (d.problem) next.death = problemText(d.problem);
    if (!next.birth && !next.death && b.date && d.date && compareDates(d.date, b.date) < 0) next.death = t.edit.dateOrder;
    setErrors(next);
    if (next.name || next.birth || next.death) {
      const first = next.name ? 'name' : next.birth ? 'birth-day' : 'death-day';
      document.getElementById(first)?.focus();
      return;
    }
    setBusy(true);
    try {
      const details = {
        name,
        knownAs,
        birth: b.date,
        death: d.date,
        country: countryChoice === 'other' ? otherCountry : countryChoice,
        home,
        story,
      };
      if (person) {
        const saved = await updatePerson(person.id, details);
        toast(t.edit.saved);
        if (saved.slug !== person.slug) navigate(`${personPath(saved.slug)}/edit`, { replace: true });
      } else {
        const created = await createPerson(details);
        toast(t.edit.created);
        navigate(`${personPath(created.slug)}/edit`, { replace: true });
      }
    } catch {
      toast(t.common.error, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form class="edit-card" onSubmit={submit} noValidate aria-labelledby="details-heading">
      <h2 id="details-heading">{t.edit.details}</h2>
      {Object.keys(errors).length > 0 && (
        <p class="error-summary" role="alert">
          {t.edit.fixErrors}
        </p>
      )}
      <div class="form-grid">
        <div class="form-wide">
          <label class="label" for="name">
            {t.edit.name}
          </label>
          <input
            id="name"
            class="field field-large"
            value={name}
            maxLength={200}
            autoComplete="off"
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
            onInput={(e) => setName(e.currentTarget.value)}
          />
          {errors.name && (
            <p class="error-text" id="name-error">
              {errors.name}
            </p>
          )}
        </div>
        <div class="form-wide">
          <label class="label" for="known-as">
            {t.edit.knownAs} <span class="optional">{t.common.optional}</span>
          </label>
          <span class="hint" id="known-as-hint">
            {t.edit.knownAsHint}
          </span>
          <input id="known-as" class="field field-narrow" value={knownAs} maxLength={60} aria-describedby="known-as-hint" onInput={(e) => setKnownAs(e.currentTarget.value)} />
        </div>
        <DateFields id="birth" legend={t.edit.born} value={birth} onChange={setBirth} error={errors.birth} />
        <DateFields id="death" legend={t.edit.died} value={death} onChange={setDeath} error={errors.death} />
        <div>
          <label class="label" for="country">
            {t.edit.country}
          </label>
          <select id="country" class="field" value={countryChoice} onChange={(e) => setCountryChoice(e.currentTarget.value)}>
            <option value="">{t.edit.countryNone}</option>
            {NPH_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {countryName(code, lang)}
              </option>
            ))}
            <option value="other">{t.edit.countryOther}</option>
          </select>
          {countryChoice === 'other' && (
            <div class="follow-up">
              <label class="label" for="country-other">
                {t.edit.countryOtherName}
              </label>
              <input id="country-other" class="field" value={otherCountry} maxLength={80} onInput={(e) => setOtherCountry(e.currentTarget.value)} />
            </div>
          )}
        </div>
        <div>
          <label class="label" for="home">
            {t.edit.home}
          </label>
          <span class="hint" id="home-hint">
            {t.edit.homeHint}
          </span>
          <input id="home" class="field" list="known-homes" value={home} maxLength={120} aria-describedby="home-hint" onInput={(e) => setHome(e.currentTarget.value)} />
          <datalist id="known-homes">
            {(homes ?? []).map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
        </div>
        <div class="form-wide">
          <label class="label" for="story">
            {t.edit.story}
          </label>
          <span class="hint" id="story-hint">
            {t.edit.storyHint}
          </span>
          <textarea id="story" class="field story-field" rows={14} value={story} maxLength={40000} aria-describedby="story-hint" onInput={(e) => setStory(e.currentTarget.value)} />
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="button" disabled={busy}>
          {busy ? t.common.saving : person ? t.common.save : t.edit.create}
        </button>
        {person ? (
          <a class="button button-quiet" href={href(personPath(person.slug))}>
            {t.edit.viewPage}
          </a>
        ) : (
          <a class="button button-quiet" href={href('/')}>
            {t.common.cancel}
          </a>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Portrait
// ---------------------------------------------------------------------------

function imageErrorText(t: ReturnType<typeof useI18n>['t'], error: unknown) {
  return error instanceof ImageError ? (error.message === 'too large' ? t.common.imageTooLarge : t.common.imageError) : t.common.error;
}

function PortraitCard({ person }: { person: Person }) {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);

  const upload = async (chosen: File[]) => {
    setFiles(chosen);
    if (chosen.length === 0) return;
    setBusy(true);
    setError('');
    try {
      await setPortrait(person.id, chosen[0]);
      toast(t.edit.portraitSet);
      setFiles([]);
      setRound((r) => r + 1);
    } catch (e) {
      setError(imageErrorText(t, e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section class="edit-card" aria-labelledby="portrait-heading">
      <h2 id="portrait-heading">{t.edit.portrait}</h2>
      <div class="portrait-editor">
        <Portrait imageId={person.portraitId} name={person.name} alt={t.person.photoOf(person.name)} class="portrait-preview" />
        <div>
          <PhotoPicker key={round} id="portrait-file" label={t.edit.portraitFile} hint={t.edit.portraitHint} files={files} onChange={upload} disabled={busy} />
          {busy && <p class="muted">{t.common.preparingPhoto}</p>}
          {error && (
            <p class="error-text" role="alert">
              {error}
            </p>
          )}
          {person.portraitId && (
            <p>
              <button
                type="button"
                class="link-button"
                onClick={async () => {
                  await setPortraitImage(person.id, null);
                  toast(t.edit.portraitRemoved);
                }}
              >
                {t.edit.removePortrait}
              </button>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Photos and albums
// ---------------------------------------------------------------------------

function PhotoRow({ photo, albums, person, first, last }: { photo: Photo; albums: Album[]; person: Person; first: boolean; last: boolean }) {
  const { t } = useI18n();
  const url = useImageUrl(photo.imageId, 'thumb');
  const [caption, setCaption] = useState(photo.caption);
  const [by, setBy] = useState(photo.contributedBy);
  useEffect(() => setCaption(photo.caption), [photo.caption]);
  useEffect(() => setBy(photo.contributedBy), [photo.contributedBy]);
  const isPortrait = person.portraitId === photo.imageId;

  const saveText = async () => {
    if (caption.trim() === photo.caption && by.trim() === photo.contributedBy) return;
    await updatePhoto(photo.id, { caption, contributedBy: by });
    toast(t.edit.saved);
  };

  return (
    <li class="photo-row">
      <div class="photo-row-thumb">
        {url ? <img src={url} alt="" /> : <span class="photo-wait" />}
        {isPortrait && <span class="badge">{t.edit.isPortrait}</span>}
      </div>
      <div class="photo-row-fields">
        <div>
          <label class="small-label" for={`caption-${photo.id}`}>
            {t.edit.caption}
          </label>
          <input id={`caption-${photo.id}`} class="field" value={caption} maxLength={300} onInput={(e) => setCaption(e.currentTarget.value)} onBlur={saveText} />
        </div>
        <div>
          <label class="small-label" for={`by-${photo.id}`}>
            {t.edit.from}
          </label>
          <input id={`by-${photo.id}`} class="field" value={by} maxLength={120} onInput={(e) => setBy(e.currentTarget.value)} onBlur={saveText} />
        </div>
        {albums.length > 0 && (
          <div>
            <label class="small-label" for={`album-${photo.id}`}>
              {t.edit.album}
            </label>
            <select
              id={`album-${photo.id}`}
              class="field"
              value={photo.albumId ?? ''}
              onChange={async (e) => {
                await updatePhoto(photo.id, { albumId: e.currentTarget.value || null });
                toast(t.edit.saved);
              }}
            >
              <option value="">{t.edit.noAlbum}</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div class="photo-row-actions">
        <button type="button" class="link-button" disabled={first} onClick={() => movePhoto(photo.id, -1)}>
          {t.edit.moveUp}
        </button>
        <button type="button" class="link-button" disabled={last} onClick={() => movePhoto(photo.id, 1)}>
          {t.edit.moveDown}
        </button>
        {!isPortrait && (
          <button
            type="button"
            class="link-button"
            onClick={async () => {
              await setPortraitImage(person.id, photo.imageId);
              toast(t.edit.portraitSet);
            }}
          >
            {t.edit.usePortrait}
          </button>
        )}
        <button
          type="button"
          class="link-button danger"
          onClick={async () => {
            if (!(await confirmAction({ title: t.edit.confirmPhoto, confirm: t.common.delete, danger: true }))) return;
            await deletePhoto(photo.id);
            toast(t.edit.photoDeleted);
          }}
        >
          {t.edit.deletePhoto}
        </button>
      </div>
    </li>
  );
}

function AlbumRow({ album }: { album: Album }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description);
  const changed = title.trim() !== album.title || description.trim() !== album.description;
  return (
    <li class="album-row">
      <form
        class="album-row-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await updateAlbum(album.id, title, description);
          toast(t.edit.saved);
        }}
      >
        <div>
          <label class="small-label" for={`album-title-${album.id}`}>
            {t.edit.albumTitle}
          </label>
          <input id={`album-title-${album.id}`} class="field" value={title} required maxLength={120} onInput={(e) => setTitle(e.currentTarget.value)} />
        </div>
        <div>
          <label class="small-label" for={`album-desc-${album.id}`}>
            {t.edit.albumDescription}
          </label>
          <input id={`album-desc-${album.id}`} class="field" value={description} maxLength={300} onInput={(e) => setDescription(e.currentTarget.value)} />
        </div>
        <div class="album-row-actions">
          <button type="submit" class="button button-quiet button-small" disabled={!changed || !title.trim()}>
            {t.common.save}
          </button>
          <button
            type="button"
            class="link-button danger"
            onClick={async () => {
              if (!(await confirmAction({ title: t.edit.confirmAlbum(album.title), text: t.edit.confirmAlbumText, confirm: t.common.delete, danger: true }))) return;
              await deleteAlbum(album.id);
              toast(t.edit.saved);
            }}
          >
            {t.edit.deleteAlbum}
          </button>
        </div>
      </form>
    </li>
  );
}

function PhotosCard({ person }: { person: Person }) {
  const { t } = useI18n();
  const { data } = useLive(() => getMemorialContent(person.id), [person.id]);
  const [files, setFiles] = useState<File[]>([]);
  const [target, setTarget] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const albums = data?.albums ?? [];
  const photos = data?.photos ?? [];

  const add = async (event: Event) => {
    event.preventDefault();
    if (files.length === 0) return;
    setFailed([]);
    setProgress({ done: 0, total: files.length });
    const result = await addPhotos(person.id, files, target || null, (done) => setProgress({ done, total: files.length }));
    setProgress(null);
    setFiles([]);
    setRound((r) => r + 1);
    if (result.added) toast(t.edit.added(result.added));
    setFailed(result.failed);
  };

  // Photos in the same groups as on the page, so "move up" and "move down" make sense.
  const groups = [
    ...albums.map((album) => ({ key: album.id, title: album.title, photos: photos.filter((p) => p.albumId === album.id) })),
    { key: 'none', title: albums.length ? t.edit.noAlbum : '', photos: photos.filter((p) => !p.albumId || !albums.some((a) => a.id === p.albumId)) },
  ].filter((g) => g.photos.length > 0);

  return (
    <section class="edit-card" aria-labelledby="photos-edit-heading">
      <h2 id="photos-edit-heading">{t.edit.photos}</h2>

      <form class="add-photos" onSubmit={add}>
        <PhotoPicker key={round} id="photo-files" label={t.edit.addPhotos} hint={t.edit.addPhotosHint} multiple files={files} onChange={setFiles} disabled={!!progress} />
        {albums.length > 0 && (
          <div>
            <label class="label" for="photo-album">
              {t.edit.toAlbum}
            </label>
            <select id="photo-album" class="field" value={target} onChange={(e) => setTarget(e.currentTarget.value)}>
              <option value="">{t.edit.noAlbum}</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div class="form-actions">
          <button type="submit" class="button" disabled={files.length === 0 || !!progress}>
            {t.edit.addPhotos}
          </button>
          {progress && (
            <span class="muted" role="status">
              {t.edit.adding(Math.min(progress.done + 1, progress.total), progress.total)}
            </span>
          )}
        </div>
        {failed.length > 0 && (
          <p class="error-text" role="alert">
            {t.edit.failed(failed.join(', '))}
          </p>
        )}
      </form>

      {photos.length === 0 ? (
        <p class="quiet-note">{t.edit.noPhotos}</p>
      ) : (
        groups.map((group) => (
          <div key={group.key} class="photo-group">
            {group.title && <h3 class="small-heading">{group.title}</h3>}
            <ul class="photo-rows">
              {group.photos.map((photo, i) => (
                <PhotoRow key={photo.id} photo={photo} albums={albums} person={person} first={i === 0} last={i === group.photos.length - 1} />
              ))}
            </ul>
          </div>
        ))
      )}

      <div class="albums-editor">
        <h3>{t.edit.albums}</h3>
        <p class="hint">{t.edit.albumsHint}</p>
        {albums.length > 0 && (
          <ul class="album-rows">
            {albums.map((album) => (
              <AlbumRow key={`${album.id}-${album.title}-${album.description}`} album={album} />
            ))}
          </ul>
        )}
        <form
          class="new-album"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            await createAlbum(person.id, newTitle, newDescription);
            setNewTitle('');
            setNewDescription('');
            toast(t.edit.albumCreated);
          }}
        >
          <div>
            <label class="label" for="new-album-title">
              {t.edit.newAlbum}: {t.edit.albumTitle}
            </label>
            <input id="new-album-title" class="field" value={newTitle} maxLength={120} onInput={(e) => setNewTitle(e.currentTarget.value)} />
          </div>
          <div>
            <label class="label" for="new-album-description">
              {t.edit.albumDescription} <span class="optional">{t.common.optional}</span>
            </label>
            <input id="new-album-description" class="field" value={newDescription} maxLength={300} onInput={(e) => setNewDescription(e.currentTarget.value)} />
          </div>
          <div class="form-actions">
            <button type="submit" class="button button-quiet" disabled={!newTitle.trim()}>
              {t.edit.createAlbum}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

function DangerCard({ person }: { person: Person }) {
  const { t } = useI18n();
  return (
    <section class="edit-card danger-card" aria-labelledby="danger-heading">
      <h2 id="danger-heading">{t.edit.danger}</h2>
      <p>{t.edit.dangerText}</p>
      <button
        type="button"
        class="button button-danger"
        onClick={async () => {
          const yes = await confirmAction({ title: t.edit.confirmDelete(person.name), text: t.edit.confirmDeleteText, confirm: t.edit.deletePage, danger: true });
          if (!yes) return;
          await deletePerson(person.id);
          toast(t.edit.deleted);
          navigate('/', { replace: true });
        }}
      >
        {t.edit.deletePage}
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function Edit({ slug }: { slug: string | null }) {
  const { t } = useI18n();
  const { data: person, error } = useLive(async () => (slug ? getPersonBySlug(slug) : null), [slug]);

  useEffect(() => {
    document.title = `${person ? t.edit.editTitle(person.name) : t.edit.newTitle} · ${t.site.name}`;
  }, [person?.name, t]);

  if (error) return <p class="page-message">{t.common.storageError}</p>;
  if (slug && person === undefined) return <p class="page-message" aria-busy="true">{t.common.loading}</p>;
  if (slug && !person) return <NotFound />;

  return (
    <div class="edit-page">
      {person && (
        <p class="back-link">
          <a href={href(personPath(person.slug))}>
            <span aria-hidden="true">← </span>
            {person.name}
          </a>
        </p>
      )}
      <h1 tabIndex={-1}>{person ? t.edit.editTitle(person.name) : t.edit.newTitle}</h1>
      {/* The key renews the form when another person is opened, or after saving under a new address. */}
      <DetailsForm key={person?.id ?? 'new'} person={person ?? null} />
      {person && (
        <>
          <PortraitCard person={person} />
          <PhotosCard person={person} />
          <DangerCard person={person} />
        </>
      )}
    </div>
  );
}
