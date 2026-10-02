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
  return <img src={src} alt={alt} width={photo.width ?? undefined} height={photo.height ?? undefined} className={className} style={{ aspectRatio: ratio }} />;
}

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
        <div key={album.id} className="mt-6 first:mt-0">
          {album.title && <h3 className="font-semibold">{album.title}</h3>}
          {album.description && <p className="text-muted">{album.description}</p>}
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {album.photos.map((p) => {
              const index = all.indexOf(p);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => setCurrent(index)}
                    aria-label={p.caption ? t('openPhoto', { caption: p.caption }) : t('openPhotoUntitled', { number: index + 1 })}
                  >
                    <Picture photo={p} src={thumbOf(p)} alt="" className="w-full object-cover" />
                  </button>
                  {p.caption && <p className="mt-1 text-small text-muted">{p.caption}</p>}
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
        className="m-auto max-h-[95vh] w-[min(64rem,95vw)] bg-paper p-4 text-ink backdrop:bg-black/80"
      >
        {photo && (
          <figure>
            <Picture photo={photo} src={publicImageUrl(photo.storage_path)} alt={photo.caption ?? ''} className="mx-auto max-h-[75vh] w-auto object-contain" />
            <figcaption className="mt-3">
              {photo.caption && <span className="block">{photo.caption}</span>}
              {photo.contributed_by && <span className="block text-small text-muted">{t('photoBy', { name: photo.contributed_by })}</span>}
            </figcaption>
          </figure>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {all.length > 1 && (
            <>
              <button type="button" className="button-quiet" onClick={() => go(-1)}>
                {t('previous')}
              </button>
              <button type="button" className="button-quiet" onClick={() => go(1)}>
                {t('next')}
              </button>
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
