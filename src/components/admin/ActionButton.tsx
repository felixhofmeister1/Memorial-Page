'use client';

import { useFormStatus } from 'react-dom';

function Submit({ label, quiet }: { label: string; quiet?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={quiet ? 'button-quiet' : 'button'} disabled={pending}>
      {label}
    </button>
  );
}

/** One button that runs one server action, optionally after asking "are you sure?". */
export function ActionButton({
  action,
  label,
  confirm,
  quiet = true,
}: {
  action: () => Promise<void>;
  label: string;
  confirm?: string;
  quiet?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className="inline"
    >
      <Submit label={label} quiet={quiet} />
    </form>
  );
}
