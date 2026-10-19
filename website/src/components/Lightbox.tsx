import { useEffect, useRef } from 'preact/hooks';
import { useImageUrl } from '../data/hooks';
import type { Photo } from '../data/types';
import { useI18n } from '../i18n';

/**
 * Shows one photo large, with the ones before and after it. A real <dialog>: Escape closes it,
 * focus stays inside, and the page behind cannot be reached. Arrow keys and swiping move along.
 */
export function Lightbox({
  photos,
  index,
  personName,
  onIndex,
  onClose,
}: {
  photos: Photo[];
  index: number;
  personName: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = photos[index];
  const url = useImageUrl(photo?.imageId, 'full');
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
    return () => node?.close();
  }, []);

  const go = (step: number) => onIndex((index + step + photos.length) % photos.length);

  if (!photo) return null;
  const several = photos.length > 1;
  return (
    <dialog
      ref={dialog}
      class="lightbox"
      aria-label={photo.caption || t.person.photoOf(personName)}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' && several) go(1);
        if (e.key === 'ArrowLeft' && several) go(-1);
      }}
      onTouchStart={(e) => (touchStart.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        const end = e.changedTouches[0]?.clientX;
        if (several && start !== null && end !== undefined && Math.abs(end - start) > 50) go(end < start ? 1 : -1);
        touchStart.current = null;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close();
      }}
    >
      <div class="lightbox-inner">
        <button type="button" class="lightbox-close" onClick={() => dialog.current?.close()} autofocus>
          {t.common.close}
          <span aria-hidden="true"> ×</span>
        </button>
        <figure class="lightbox-figure">
          {url ? <img src={url} alt={photo.caption || t.person.photoOf(personName)} /> : <div class="lightbox-wait" />}
          {(photo.caption || photo.contributedBy || several) && (
            <figcaption>
              {photo.caption && <span>{photo.caption}</span>}
              {photo.contributedBy && <span class="lightbox-by"> · {photo.contributedBy}</span>}
              {several && (
                <span class="lightbox-count">
                  {index + 1} / {photos.length}
                </span>
              )}
            </figcaption>
          )}
        </figure>
        {several && (
          <>
            <button type="button" class="lightbox-nav lightbox-prev" onClick={() => go(-1)} aria-label={t.person.previous}>
              <span aria-hidden="true">‹</span>
            </button>
            <button type="button" class="lightbox-nav lightbox-next" onClick={() => go(1)} aria-label={t.person.next}>
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
