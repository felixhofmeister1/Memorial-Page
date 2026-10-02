'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import type { FormState } from '@/lib/forms';
import { FieldError } from './fields';

const MAX_EDGE = 2000;

/**
 * Makes large phone photos small before they are sent, so uploads work on slow
 * connections and stay under the server's size limit. The server re-encodes the
 * image anyway (and removes metadata); this is only about speed.
 * Without JavaScript the original file is sent.
 */
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 2_000_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function PhotoField({ name, label, hint, state }: { name: string; label: string; hint?: string; state: FormState }) {
  const t = useTranslations('Forms');
  const id = useId();
  const [busy, setBusy] = useState(false);
  const error = state.fieldErrors?.[name];

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    const smaller = await shrink(file);
    if (smaller !== file && typeof DataTransfer !== 'undefined') {
      const transfer = new DataTransfer();
      transfer.items.add(smaller);
      input.files = transfer.files;
    }
    setBusy(false);
  }

  return (
    <div>
      <label htmlFor={id} className="label">
        {label} <span className="font-normal text-muted">({t('optional')})</span>
      </label>
      {hint && (
        <span id={`${id}-hint`} className="hint">
          {hint}
        </span>
      )}
      <input
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        aria-busy={busy}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined}
      />
      <FieldError id={`${id}-error`} code={error} />
    </div>
  );
}
