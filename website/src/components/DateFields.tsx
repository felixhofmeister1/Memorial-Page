import { useI18n } from '../i18n';
import { monthNames, type DateInput } from '../lib/dates';

/** Day, month and year as three fields: only the year is needed. */
export function DateFields({
  id,
  legend,
  value,
  onChange,
  error,
}: {
  id: string;
  legend: string;
  value: DateInput;
  onChange: (value: DateInput) => void;
  error?: string;
}) {
  const { t, lang } = useI18n();
  const describedBy = [`${id}-hint`, error ? `${id}-error` : ''].filter(Boolean).join(' ');
  const invalid = error ? 'true' : undefined;
  return (
    <fieldset class="date-fields">
      <legend class="label">{legend}</legend>
      <span class="hint" id={`${id}-hint`}>
        {t.edit.dateHint}
      </span>
      <div class="date-row">
        <div class="date-day">
          <label class="small-label" for={`${id}-day`}>
            {t.edit.day}
          </label>
          <input
            id={`${id}-day`}
            class="field"
            inputMode="numeric"
            maxLength={2}
            value={value.day}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onInput={(e) => onChange({ ...value, day: e.currentTarget.value.replace(/\D/g, '') })}
          />
        </div>
        <div class="date-month">
          <label class="small-label" for={`${id}-month`}>
            {t.edit.month}
          </label>
          <select
            id={`${id}-month`}
            class="field"
            value={value.month}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => onChange({ ...value, month: e.currentTarget.value })}
          >
            <option value="">–</option>
            {monthNames(lang).map((name, i) => (
              <option key={i} value={String(i + 1)}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div class="date-year">
          <label class="small-label" for={`${id}-year`}>
            {t.edit.year}
          </label>
          <input
            id={`${id}-year`}
            class="field"
            inputMode="numeric"
            maxLength={4}
            value={value.year}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onInput={(e) => onChange({ ...value, year: e.currentTarget.value.replace(/\D/g, '') })}
          />
        </div>
      </div>
      {error && (
        <p class="error-text" id={`${id}-error`}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
