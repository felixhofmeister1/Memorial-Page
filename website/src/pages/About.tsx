import { useEffect, useState } from 'preact/hooks';
import { BackupError, createBackup, eraseEverything, markBackupSaved, restoreBackup, storageInfo } from '../data/backup';
import { useLive } from '../data/hooks';
import { getMeta } from '../data/store';
import { LANGS, useI18n } from '../i18n';
import { formatTimestamp } from '../lib/dates';
import { confirmAction, toast } from '../lib/feedback';
import { formatBytes } from '../lib/text';

export function About() {
  const { t, lang, setLang } = useI18n();
  const { data: info } = useLive(async () => ({ ...(await storageInfo()), lastBackup: await getMeta<string>('lastBackupAt') }), []);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    document.title = `${t.about.title} · ${t.site.name}`;
  }, [t]);

  const save = async () => {
    setSaving(true);
    try {
      const { blob, filename } = await createBackup();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      await markBackupSaved();
      toast(t.about.backupSaved);
    } catch {
      toast(t.common.error, 'error');
    } finally {
      setSaving(false);
    }
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    setRestoring(true);
    setRestoreMessage(null);
    try {
      const r = await restoreBackup(file);
      setRestoreMessage({ text: t.about.restored(r.people, r.photos, r.tributes, r.candles), error: false });
    } catch (error) {
      setRestoreMessage({ text: error instanceof BackupError ? t.about.notBackup : t.common.error, error: true });
    } finally {
      setRestoring(false);
      setRound((r) => r + 1);
    }
  };

  return (
    <div class="about-page">
      <h1 tabIndex={-1}>{t.about.title}</h1>
      <div class="prose">
        {t.about.intro.map((p, i) => (
          <p key={i} class={i === 0 ? 'lede' : undefined}>
            {p}
          </p>
        ))}
      </div>

      <section class="edit-card" aria-labelledby="where-heading">
        <h2 id="where-heading">{t.about.whereTitle}</h2>
        {t.about.where.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {info && (
          <ul class="facts">
            {info.persisted !== null && <li>{info.persisted ? t.about.persisted : t.about.notPersisted}</li>}
            {info.used !== null && <li>{t.about.used(formatBytes(info.used, lang))}</li>}
          </ul>
        )}
      </section>

      <section class="edit-card" aria-labelledby="backup-heading">
        <h2 id="backup-heading">{t.about.backupTitle}</h2>
        <p>{t.about.backupText}</p>
        <p class="muted">{info?.lastBackup ? t.about.lastBackup(formatTimestamp(info.lastBackup, lang)) : t.about.noBackup}</p>
        <div class="form-actions">
          <button type="button" class="button" onClick={save} disabled={saving}>
            {saving ? t.about.preparing : t.about.saveBackup}
          </button>
        </div>

        <h3>{t.about.restoreTitle}</h3>
        <p>{t.about.restoreText}</p>
        <div class="picker-row">
          <input
            key={round}
            id="restore-file"
            type="file"
            accept="application/json,.json"
            class="visually-hidden"
            disabled={restoring}
            onChange={(e) => restore(e.currentTarget.files?.[0])}
          />
          <label for="restore-file" class="button button-quiet">
            {restoring ? t.about.restoring : t.about.chooseBackup}
          </label>
        </div>
        {restoreMessage && (
          <p class={restoreMessage.error ? 'error-text' : 'success-text'} role={restoreMessage.error ? 'alert' : 'status'}>
            {restoreMessage.text}
          </p>
        )}
      </section>

      <section class="edit-card" aria-labelledby="language-heading">
        <h2 id="language-heading">{t.site.language}</h2>
        <ul class="language-choice">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button type="button" class={`button ${l.code === lang ? '' : 'button-quiet'}`} aria-pressed={l.code === lang} lang={l.code} onClick={() => setLang(l.code)}>
                {l.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section class="edit-card danger-card" aria-labelledby="erase-heading">
        <h2 id="erase-heading">{t.about.eraseTitle}</h2>
        <p>{t.about.eraseText}</p>
        <button
          type="button"
          class="button button-danger"
          onClick={async () => {
            const yes = await confirmAction({ title: t.about.confirmErase, text: t.about.confirmEraseText, confirm: t.about.erase, danger: true });
            if (!yes) return;
            await eraseEverything();
            toast(t.about.erased);
          }}
        >
          {t.about.erase}
        </button>
      </section>
    </div>
  );
}
