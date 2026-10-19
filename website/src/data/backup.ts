import { changed, DATA_STORES, db, now } from './db';
import { setMeta } from './store';
import type { Album, Candle, Person, Photo, StoredImage, Tribute } from './types';

/*
 * A backup is one JSON file with everything, photos included (as data URLs).
 * Restoring adds what is in the file and updates what is already here; it never deletes.
 */

const FORMAT = 'remembered-backup';

type BackupImage = Omit<StoredImage, 'full' | 'thumb'> & { full: string; thumb: string };

type BackupFile = {
  format: typeof FORMAT;
  version: 1;
  exportedAt: string;
  people: Person[];
  albums: Album[];
  photos: Photo[];
  tributes: Tribute[];
  candles: Candle[];
  images: BackupImage[];
};

export class BackupError extends Error {}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const fromDataUrl = async (url: string) => {
  if (!url.startsWith('data:image/')) throw new BackupError('not an image');
  return (await fetch(url)).blob();
};

export async function createBackup(): Promise<{ blob: Blob; filename: string; people: number }> {
  const database = await db();
  const [people, albums, photos, tributes, candles, images] = await Promise.all([
    database.getAll('people'),
    database.getAll('albums'),
    database.getAll('photos'),
    database.getAll('tributes'),
    database.getAll('candles'),
    database.getAll('images'),
  ]);
  const file: BackupFile = {
    format: FORMAT,
    version: 1,
    exportedAt: now(),
    people,
    albums,
    photos,
    tributes,
    candles,
    images: await Promise.all(images.map(async (image) => ({ ...image, full: await toDataUrl(image.full), thumb: await toDataUrl(image.thumb) }))),
  };
  const day = new Date().toISOString().slice(0, 10);
  return { blob: new Blob([JSON.stringify(file)], { type: 'application/json' }), filename: `remembered-backup-${day}.json`, people: people.length };
}

export async function markBackupSaved(): Promise<void> {
  await setMeta('lastBackupAt', now());
  changed();
}

const isArrayOf = (value: unknown, keys: string[]) =>
  Array.isArray(value) && value.every((row) => row && typeof row === 'object' && keys.every((k) => k in row));

export async function restoreBackup(file: File): Promise<{ people: number; photos: number; tributes: number; candles: number }> {
  let data: BackupFile;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new BackupError('not json');
  }
  if (
    data?.format !== FORMAT ||
    data.version !== 1 ||
    !isArrayOf(data.people, ['id', 'slug', 'name']) ||
    !isArrayOf(data.albums, ['id', 'personId']) ||
    !isArrayOf(data.photos, ['id', 'personId', 'imageId']) ||
    !isArrayOf(data.tributes, ['id', 'personId', 'message']) ||
    !isArrayOf(data.candles, ['id', 'personId']) ||
    !isArrayOf(data.images, ['id', 'full', 'thumb'])
  ) {
    throw new BackupError('not a backup');
  }

  // Turn the images back into files first; nothing is written if one of them is broken.
  const images: StoredImage[] = await Promise.all(
    data.images.map(async (image) => ({ ...image, full: await fromDataUrl(image.full), thumb: await fromDataUrl(image.thumb) })),
  );

  const database = await db();
  const tx = database.transaction([...DATA_STORES], 'readwrite');
  // A page whose address is already used by someone else here gets a new address.
  const people = tx.objectStore('people');
  for (const person of data.people) {
    let slug = person.slug;
    for (let n = 2; ; n++) {
      const other = await people.index('slug').get(slug);
      if (!other || other.id === person.id) break;
      slug = `${person.slug}-${n}`;
    }
    await people.put({ ...person, slug });
  }
  for (const album of data.albums) await tx.objectStore('albums').put(album);
  for (const photo of data.photos) await tx.objectStore('photos').put(photo);
  for (const tribute of data.tributes) await tx.objectStore('tributes').put(tribute);
  for (const candle of data.candles) await tx.objectStore('candles').put(candle);
  for (const image of images) await tx.objectStore('images').put(image);
  await tx.done;
  await setMeta('lastChangeAt', now());
  changed();
  return { people: data.people.length, photos: data.photos.length, tributes: data.tributes.length, candles: data.candles.length };
}

export async function eraseEverything(): Promise<void> {
  const database = await db();
  const tx = database.transaction([...DATA_STORES, 'meta'], 'readwrite');
  for (const name of DATA_STORES) await tx.objectStore(name).clear();
  await tx.objectStore('meta').delete('lastChangeAt');
  await tx.objectStore('meta').delete('lastBackupAt');
  await tx.done;
  changed();
}

export async function storageInfo(): Promise<{ used: number | null; persisted: boolean | null }> {
  const [estimate, persisted] = await Promise.all([
    navigator.storage?.estimate?.().catch(() => null) ?? null,
    navigator.storage?.persisted?.().catch(() => null) ?? null,
  ]);
  return { used: estimate?.usage ?? null, persisted };
}
