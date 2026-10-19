import { useState } from 'preact/hooks';
import { useImageUrl } from '../data/hooks';
import type { Album, Photo } from '../data/types';
import { useI18n } from '../i18n';
import { Lightbox } from './Lightbox';

function Thumb({ photo, label, onOpen }: { photo: Photo; label: string; onOpen: () => void }) {
  const url = useImageUrl(photo.imageId, 'thumb');
  return (
    <li class="photo-item">
      <button type="button" class="photo-button" onClick={onOpen} aria-label={label}>
        {url ? <img src={url} alt="" /> : <span class="photo-wait" />}
      </button>
      {photo.caption && <p class="photo-caption">{photo.caption}</p>}
    </li>
  );
}

/** The photos of a memorial, album by album; photos without an album come last. */
export function PhotoAlbums({ albums, photos, personName }: { albums: Album[]; photos: Photo[]; personName: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);

  const groups = [
    ...albums.map((album) => ({ album, photos: photos.filter((p) => p.albumId === album.id) })),
    { album: null, photos: photos.filter((p) => !p.albumId || !albums.some((a) => a.id === p.albumId)) },
  ].filter((g) => g.photos.length > 0);
  // One sequence for the viewer, in the order shown on the page.
  const sequence = groups.flatMap((g) => g.photos);
  if (sequence.length === 0) return null;

  return (
    <section class="memorial-section" aria-labelledby="photos-heading">
      <h2 id="photos-heading">{t.person.photos}</h2>
      {groups.map(({ album, photos: list }) => (
        <div class="album" key={album?.id ?? 'loose'}>
          {album ? (
            <>
              <h3 class="album-title">{album.title}</h3>
              {album.description && <p class="album-description">{album.description}</p>}
            </>
          ) : (
            groups.length > 1 && <h3 class="album-title">{t.person.morePhotos}</h3>
          )}
          <ul class="photo-grid">
            {list.map((photo) => {
              const position = sequence.indexOf(photo);
              return (
                <Thumb
                  key={photo.id}
                  photo={photo}
                  label={`${t.person.openPhoto(position + 1, sequence.length)}${photo.caption ? `: ${photo.caption}` : ''}`}
                  onOpen={() => setOpen(position)}
                />
              );
            })}
          </ul>
        </div>
      ))}
      {open !== null && <Lightbox photos={sequence} index={open} personName={personName} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}
