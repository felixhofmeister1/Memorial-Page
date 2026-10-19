import { useId } from 'preact/hooks';
import { useI18n } from '../i18n';

/**
 * A file field that looks like the rest of the page: a button and the name of the chosen file.
 * The real <input type="file"> stays in place (visually hidden), so it works with keyboard,
 * screen readers and drag and drop on the label.
 */
export function PhotoPicker({
  label,
  hint,
  multiple = false,
  files,
  onChange,
  disabled = false,
  id: givenId,
}: {
  label: string;
  hint?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  id?: string;
}) {
  const { t } = useI18n();
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <div class="picker">
      <span class="label" id={`${id}-label`}>
        {label}
      </span>
      {hint && (
        <span class="hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      <div class="picker-row">
        <input
          id={id}
          type="file"
          accept="image/*"
          multiple={multiple}
          disabled={disabled}
          class="visually-hidden"
          aria-labelledby={`${id}-label`}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            const input = e.currentTarget;
            onChange(Array.from(input.files ?? []));
          }}
        />
        <label for={id} class="button button-quiet" aria-hidden="true">
          {files.length > 0 ? t.common.chooseOther : multiple ? t.common.choosePhotos : t.common.choosePhoto}
        </label>
        <span class="picker-name" aria-live="polite">
          {files.length === 0 ? t.common.noFile : files.length === 1 ? files[0].name : t.common.filesChosen(files.length)}
        </span>
      </div>
    </div>
  );
}
