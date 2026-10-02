'use client';

import { useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';
import type { ErrorCode, FormState } from '@/lib/forms';
import { HONEYPOT_NAME } from './honeypot';

type FieldProps = {
  name: string;
  label: string;
  state: FormState;
  hint?: string;
  optional?: boolean;
  multiline?: boolean;
  rows?: number;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
  defaultValue?: string;
  className?: string;
};

export function TextField({
  name,
  label,
  state,
  hint,
  optional,
  multiline,
  rows = 6,
  type = 'text',
  autoComplete,
  maxLength,
  defaultValue,
  className = '',
}: FieldProps) {
  const t = useTranslations('Forms');
  const id = useId();
  const error = state.fieldErrors?.[name];
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name,
    className: 'field',
    required: !optional,
    maxLength,
    autoComplete,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    defaultValue: state.values?.[name] ?? defaultValue,
  } as const;

  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="font-normal text-muted"> ({t('optional')})</span>}
      </label>
      {hint && (
        <span id={`${id}-hint`} className="hint">
          {hint}
        </span>
      )}
      {multiline ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />}
      <FieldError id={`${id}-error`} code={error} />
    </div>
  );
}

export function FieldError({ id, code }: { id: string; code?: ErrorCode }) {
  const t = useTranslations('Forms.errors');
  if (!code) return null;
  return (
    <span id={id} className="error-text">
      {t(code)}
    </span>
  );
}

export function CheckboxField({ name, label, state }: { name: string; label: string; state: FormState }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input id={id} type="checkbox" name={name} defaultChecked={state.values?.[name] === 'on'} className="mt-1.5" />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

/** Shown above the form when something about the whole submission went wrong. */
export function FormMessage({ state }: { state: FormState }) {
  const t = useTranslations('Forms');
  const hasFieldErrors = state.fieldErrors && Object.keys(state.fieldErrors).length > 0;
  if (state.status !== 'error') return null;
  return (
    <div role="alert" className="border-l-4 border-[var(--color-error)] py-1 pl-3 text-[var(--color-error)]">
      {state.formError ? t(`errors.${state.formError}`) : hasFieldErrors ? t('errorSummary') : t('errors.server')}
    </div>
  );
}

/** Hidden fields every public form carries: signed timestamp, language and the honeypot. */
export function SpamGuards({ token, locale }: { token: string; locale: string }) {
  return (
    <>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="locale" value={locale} />
      <div className="hp-field" aria-hidden="true">
        <label>
          Leave this field empty
          <input type="text" name={HONEYPOT_NAME} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
    </>
  );
}

export function Optional({ children }: { children: ReactNode }) {
  return <span className="font-normal text-muted">{children}</span>;
}
