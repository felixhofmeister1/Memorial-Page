'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useRef, startTransition, type ReactNode } from 'react';
import type { AdminFormState } from '@/lib/actions/admin';

type Props = {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
  /** Clear the form after a successful save (for uploads). Otherwise what was typed stays. */
  resetOnSuccess?: boolean;
};

/**
 * Admin form that shows the result next to the button. Submits manually so that
 * typed values are not reset when the server reports a problem.
 */
export function StatefulForm({ action, submitLabel, children, className = '', resetOnSuccess }: Props) {
  const t = useTranslations('Admin');
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, { status: 'idle' } as AdminFormState);

  useEffect(() => {
    if (state.status === 'success' && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="submit" className="button" disabled={pending}>
          {submitLabel}
        </button>
        {state.message && (
          <p role={state.status === 'error' ? 'alert' : 'status'} className={state.status === 'error' ? 'text-[var(--color-error)]' : ''}>
            {t(state.message)}
          </p>
        )}
      </div>
    </form>
  );
}
