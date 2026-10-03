'use client';
/* eslint-disable @next/next/no-img-element -- images are resized when uploaded; no runtime optimisation needed */

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { publicImageUrl } from '@/lib/media';
import type { PublicAlbum, PublicPhoto } from '@/lib/data/public';

function thumbOf(photo: PublicPhoto) {
  return publicImageUrl(photo.thumb_path ?? photo.storage_path);
}

function Picture({ photo, src, alt, className }: { photo: PublicPhoto; src: string | null; alt: string; className?: string }) {
  const ratio = photo.width && photo.height ? `${photo.width} / ${photo.height}` : '4 / 3';
  if (!src) return <div className={`grey-placeholder ${className}`} style={{ aspectRatio: ratio }} />;
  return (
    <img
      src={src}
      alt={alt}
      width={photo.width ?? undefined}
      height={photo.height ?? undefined}
      loading="lazy"
      className={className}
      style={{ aspectRatio: ratio }}
    />
  );
}

/** Albums laid out like prints at their own proportions; a click opens the photo large. */
export function PhotoAlbums({ albums }: { albums: PublicAlbum[] }) {
  const t = useTranslations('Memorial');
  const all = albums.flatMap((album) => album.photos);
  const [current, setCurrent] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (current !== null && !dialog.open) dialog.showModal();
    if (current === null && dialog.open) dialog.close();
  }, [current]);

  const photo = current !== null ? all[current] : null;
  const go = (step: number) => setCurrent((i) => (i === null ? i : (i + step + all.length) % all.length));

  return (
    <>
      {albums.map((album) => (
        <div key={album.id} className="mt-12 first:mt-0">
          {(album.title || album.description) && (
            <div className="mb-5">
              {album.title && <h3 className="font-serif text-[1.375rem] font-normal">{album.title}</h3>}
              {album.description && <p className="mt-1 italic text-muted">{album.description}</p>}
            </div>
          )}
          <ul className="columns-2 gap-4 sm:columns-3 sm:gap-5">
            {album.photos.map((p) => {
              const index = all.indexOf(p);
              return (
                <li key={p.id} className="mb-5 break-inside-avoid">
                  <figure>
                    <button
                      type="button"
                      className="group block w-full cursor-zoom-in text-left"
                      onClick={() => setCurrent(index)}
                      aria-label={p.caption ? t('openPhoto', { caption: p.caption }) : t('openPhotoUntitled', { number: index + 1 })}
                    >
                      <Picture
                        photo={p}
                        src={thumbOf(p)}
                        alt=""
                        className="print w-full object-cover transition-opacity duration-150 group-hover:opacity-90"
                      />
                    </button>
                    {p.caption && (
                      <figcaption className="mt-2 text-[0.9375rem] italic leading-snug text-muted">{p.caption}</figcaption>
                    )}
                  </figure>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <dialog
        ref={dialogRef}
        onClose={() => setCurrent(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
        aria-label={photo?.caption || t('photos')}
        className="m-auto max-h-[96vh] w-[min(68rem,96vw)] bg-paper p-4 text-ink backdrop:bg-[#1c1815]/85 md:p-6"
      >
        {photo && (
          <figure>
            <Picture
              photo={photo}
              src={publicImageUrl(photo.storage_path)}
              alt={photo.caption ?? ''}
              className="print mx-auto max-h-[74vh] w-auto object-contain"
            />
            <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className="italic">{photo.caption}</span>
              {photo.contributed_by && (
                <span className="ui text-small text-muted">{t('photoBy', { name: photo.contributed_by })}</span>
              )}
            </figcaption>
          </figure>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {all.length > 1 && (
            <>
              <button type="button" className="button-quiet" onClick={() => go(-1)}>
                <span aria-hidden="true">←</span> {t('previous')}
              </button>
              <button type="button" className="button-quiet" onClick={() => go(1)}>
                {t('next')} <span aria-hidden="true">→</span>
              </button>
              <span className="ui ml-2 text-small text-muted">
                {(current ?? 0) + 1} / {all.length}
              </span>
            </>
          )}
          <button type="button" className="button-quiet ml-auto" onClick={() => setCurrent(null)} autoFocus>
            {t('close')}
          </button>
        </div>
      </dialog>
    </>
  );
}
