import type { ZodError } from 'zod';

/** Error codes map to messages under Forms.errors.* */
export type ErrorCode =
  | 'required'
  | 'tooLong'
  | 'email'
  | 'photoType'
  | 'photoSize'
  | 'photoBroken'
  | 'tooFast'
  | 'expired'
  | 'rateLimited'
  | 'spam'
  | 'notFound'
  | 'server';

export type FormState = {
  status: 'idle' | 'success' | 'error';
  fieldErrors?: Partial<Record<string, ErrorCode>>;
  formError?: ErrorCode;
  /** Submitted text values, so the form keeps them after an error. */
  values?: Record<string, string>;
  /** Candles: whether the visitor added a name or words (those wait for moderation). */
  withWords?: boolean;
};

export const initialFormState: FormState = { status: 'idle' };

export function fieldErrorsFrom(error: ZodError): Partial<Record<string, ErrorCode>> {
  const errors: Partial<Record<string, ErrorCode>> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '');
    if (!field || errors[field]) continue;
    if (issue.code === 'too_big') errors[field] = 'tooLong';
    else if (issue.code === 'invalid_format' && 'format' in issue && issue.format === 'email') errors[field] = 'email';
    else errors[field] = 'required';
  }
  return errors;
}

export function textValues(formData: FormData, fields: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === 'string') values[field] = value;
  }
  return values;
}
