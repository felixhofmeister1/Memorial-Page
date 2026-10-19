import { useState } from 'preact/hooks';
import { addTribute, deleteTribute, updateTribute } from '../data/store';
import { useImageUrl } from '../data/hooks';
import type { Tribute } from '../data/types';
import { useI18n } from '../i18n';
import { formatTimestamp } from '../lib/dates';
import { confirmAction, toast } from '../lib/feedback';
import { ImageError } from '../lib/images';
import { paragraphs } from '../lib/text';
import { PhotoPicker } from './PhotoPicker';

function useImageErrorText() {
  const { t } = useI18n();
  return (error: unknown) =>
    error instanceof ImageError ? (error.message === 'too large' ? t.common.imageTooLarge : t.common.imageError) : t.common.error;
}

type Errors = { author?: string; message?: string; photo?: string; form?: string };

function TributeFields({
  idPrefix,
  personName,
  initial,
  currentImageId,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  personName: string;
  initial: { author: string; relation: string; message: string };
  currentImageId?: string | null;
  submitLabel: string;
  onSubmit: (values: { author: string; relation: string; message: string }, file: File | null, removeImage: boolean) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const imageErrorText = useImageErrorText();
  const [values, setValues] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0); // a new file field after sending, so the chosen file is cleared
  const currentUrl = useImageUrl(currentImageId && !removeImage ? currentImageId : null, 'thumb');

  const submit = async (event: Event) => {
    event.preventDefault();
    const next: Errors = {};
    if (!values.author.trim()) next.author = t.tribute.nameRequired;
    if (!values.message.trim()) next.message = t.tribute.messageRequired;
    setErrors(next);
    if (next.author || next.message) {
      document.getElementById(`${idPrefix}-${next.author ? 'author' : 'message'}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit(values, files[0] ?? null, removeImage);
      if (!onCancel) {
        setValues({ author: values.author, relation: values.relation, message: '' });
        setFiles([]);
        setRound((r) => r + 1);
      }
    } catch (error) {
      setErrors({ photo: imageErrorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const field = (key: 'author' | 'relation' | 'message') => ({
    id: `${idPrefix}-${key}`,
    value: values[key],
    onInput: (e: Event) => setValues((v) => ({ ...v, [key]: (e.currentTarget as HTMLInputElement).value })),
  });

  return (
    <form class="form-grid" onSubmit={submit} noValidate>
      <div>
        <label class="label" for={`${idPrefix}-author`}>
          {t.tribute.author}
        </label>
        <input
          {...field('author')}
          class="field"
          autoComplete="name"
          maxLength={120}
          aria-invalid={errors.author ? 'true' : undefined}
          aria-describedby={errors.author ? `${idPrefix}-author-error` : undefined}
        />
        {errors.author && (
          <p class="error-text" id={`${idPrefix}-author-error`}>
            {errors.author}
          </p>
        )}
      </div>
      <div>
        <label class="label" for={`${idPrefix}-relation`}>
          {t.tribute.relation(personName)} <span class="optional">{t.common.optional}</span>
        </label>
        <input {...field('relation')} class="field" maxLength={160} placeholder={t.tribute.relationHint} />
      </div>
      <div class="form-wide">
        <label class="label" for={`${idPrefix}-message`}>
          {t.tribute.message}
        </label>
        <textarea
          {...field('message')}
          class="field"
          rows={6}
          maxLength={8000}
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={errors.message ? `${idPrefix}-message-error` : undefined}
        />
        {errors.message && (
          <p class="error-text" id={`${idPrefix}-message-error`}>
            {errors.message}
          </p>
        )}
      </div>
      <div class="form-wide">
        {currentUrl && (
          <div class="current-photo">
            <img src={currentUrl} alt="" />
            <button type="button" class="link-button" onClick={() => setRemoveImage(true)}>
              {t.tribute.removePhoto}
            </button>
          </div>
        )}
        <PhotoPicker
          key={round}
          id={`${idPrefix}-photo`}
          label={`${t.tribute.photo} ${t.common.optional}`}
          files={files}
          onChange={setFiles}
          disabled={busy}
        />
        {errors.photo && (
          <p class="error-text" role="alert">
            {errors.photo}
          </p>
        )}
      </div>
      <div class="form-wide form-actions">
        <button type="submit" class="button" disabled={busy}>
          {busy ? (files.length ? t.common.preparingPhoto : t.common.saving) : submitLabel}
        </button>
        {onCancel && (
          <button type="button" class="button button-quiet" onClick={onCancel} disabled={busy}>
            {t.common.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

function TributeItem({ tribute, personName }: { tribute: Tribute; personName: string }) {
  const { t, lang } = useI18n();
  const [editing, setEditing] = useState(false);
  const url = useImageUrl(tribute.imageId, 'full');

  if (editing) {
    return (
      <li class="tribute tribute-editing">
        <TributeFields
          idPrefix={`tribute-${tribute.id}`}
          personName={personName}
          initial={{ author: tribute.author, relation: tribute.relation, message: tribute.message }}
          currentImageId={tribute.imageId}
          submitLabel={t.common.save}
          onSubmit={async (values, file, removeImage) => {
            await updateTribute(tribute.id, values, file ? { file } : removeImage ? { remove: true } : null);
            setEditing(false);
            toast(t.tribute.updated);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li class="tribute">
      <div class="tribute-text">
        {paragraphs(tribute.message).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {url && <img class="tribute-photo" src={url} alt="" />}
      <footer class="tribute-footer">
        <p class="tribute-author">
          <span aria-hidden="true">— </span>
          <strong>{tribute.author}</strong>
          {tribute.relation && <span class="tribute-relation">, {tribute.relation}</span>}
        </p>
        <p class="tribute-meta">
          <time dateTime={tribute.createdAt}>{formatTimestamp(tribute.createdAt, lang)}</time>
          <span class="no-print">
            <button type="button" class="link-button" onClick={() => setEditing(true)}>
              {t.common.edit}
            </button>
            <button
              type="button"
              class="link-button"
              onClick={async () => {
                const yes = await confirmAction({ title: t.tribute.confirmTitle, text: t.tribute.confirmText, confirm: t.common.remove, danger: true });
                if (!yes) return;
                await deleteTribute(tribute.id);
                toast(t.tribute.removed);
              }}
            >
              {t.common.remove}
            </button>
          </span>
        </p>
      </footer>
    </li>
  );
}

export function Tributes({ personId, personName, tributes }: { personId: string; personName: string; tributes: Tribute[] }) {
  const { t } = useI18n();
  return (
    <>
      <section class="memorial-section" aria-labelledby="tributes-heading">
        <h2 id="tributes-heading">{t.person.tributes}</h2>
        {tributes.length === 0 ? (
          <p class="quiet-note">{t.person.noTributes}</p>
        ) : (
          <ul class="tribute-list">
            {tributes.map((tribute) => (
              <TributeItem key={tribute.id} tribute={tribute} personName={personName} />
            ))}
          </ul>
        )}
      </section>
      <section id="write" class="panel write-panel no-print" aria-labelledby="write-heading" tabIndex={-1}>
        <h2 id="write-heading">{t.tribute.title(personName)}</h2>
        <p class="panel-intro">{t.tribute.intro}</p>
        <TributeFields
          idPrefix="write"
          personName={personName}
          initial={{ author: '', relation: '', message: '' }}
          submitLabel={t.tribute.send}
          onSubmit={async (values, file) => {
            await addTribute(personId, values, file);
            toast(t.tribute.added);
          }}
        />
      </section>
    </>
  );
}
