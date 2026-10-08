/* eslint-disable @next/next/no-img-element -- images are resized when uploaded; no runtime optimisation needed */
import { publicImageUrl } from '@/lib/media';

type Props = {
  path: string | null;
  /** Accessible name. Pass '' when the name is already written next to the picture. */
  name: string;
  /** Shown quietly on the grey area while there is no photo yet. */
  initial?: string;
  className?: string;
  sizes?: 'small' | 'large';
};

/**
 * A portrait. Without a photo: a plain grey area of the same shape, with the person's
 * initial set small in the serif, like a bookplate. (Placeholder files count as no photo.)
 */
export function Portrait({ path, name, initial, className = '', sizes = 'large' }: Props) {
  const isPlaceholder = !path || path.startsWith('/placeholders/');
  const src = isPlaceholder
    ? null
    : publicImageUrl(sizes === 'small' && path.startsWith('media/') ? path.replace(/\.jpg$/, '-thumb.jpg') : path);

  if (!src) {
    const a11y = name ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true };
    return (
      <div className={`grey-placeholder aspect-[3/4] ${className}`} {...a11y}>
        {initial && (
          <svg viewBox="0 0 30 40" className="h-full w-full" aria-hidden="true">
            <text
              x="15"
              y="23.5"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill="currentColor"
              className="font-serif text-ink/25"
            >
              {initial}
            </text>
          </svg>
        )}
      </div>
    );
  }
  return <img src={src} alt={name} className={`aspect-[3/4] object-cover ${className}`} width={900} height={1200} />;
}

/** First letter of the full name (as on a bookplate), for the placeholder. */
export function initialOf(person: { name: string }): string {
  return person.name.replace(/^[^\p{L}]+/u, '').charAt(0).toUpperCase();
}
