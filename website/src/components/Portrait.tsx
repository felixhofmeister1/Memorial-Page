import { useImageUrl } from '../data/hooks';
import { initialOf } from '../lib/text';

/**
 * The portrait, always 4 by 5. Without a photo, a quiet tile with the first letter of the name.
 * `alt` is empty where the name is written right next to it.
 */
export function Portrait({
  imageId,
  name,
  alt,
  variant = 'thumb',
  class: className = '',
}: {
  imageId: string | null;
  name: string;
  alt: string;
  variant?: 'thumb' | 'full';
  class?: string;
}) {
  const url = useImageUrl(imageId, variant);
  return (
    <div class={`portrait ${className}`}>
      {imageId && url ? (
        <img src={url} alt={alt} />
      ) : (
        <span class="portrait-initial" aria-hidden="true">
          {initialOf(name)}
        </span>
      )}
    </div>
  );
}
