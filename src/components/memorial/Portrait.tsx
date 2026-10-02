/* eslint-disable @next/next/no-img-element -- images are resized when uploaded; no runtime optimisation needed */
import { publicImageUrl } from '@/lib/media';

type Props = {
  path: string | null;
  /** Accessible name. Pass '' when the name is already written next to the picture. */
  name: string;
  className?: string;
  sizes?: 'small' | 'large';
};

/** A portrait, or a plain grey area of the same shape when there is no photo yet. */
export function Portrait({ path, name, className = '', sizes = 'large' }: Props) {
  const src = publicImageUrl(sizes === 'small' && path?.startsWith('media/') ? path.replace(/\.jpg$/, '-thumb.jpg') : path);
  if (!src) {
    return name ? (
      <div className={`grey-placeholder aspect-[3/4] ${className}`} role="img" aria-label={name} />
    ) : (
      <div className={`grey-placeholder aspect-[3/4] ${className}`} aria-hidden="true" />
    );
  }
  return <img src={src} alt={name} className={`aspect-[3/4] object-cover ${className}`} width={900} height={1200} />;
}
