import { prepareImage } from '../lib/images';
import { sortKey } from '../lib/dates';
import { slugify } from '../lib/text';
import { changed, db, newId, now } from './db';
import type { Album, Candle, Person, PersonDetails, Photo, StoredImage, Tribute } from './types';

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export type PersonListItem = Person & { candles: number };

export async function listPeople(): Promise<PersonListItem[]> {
  const database = await db();
  const [people, candles] = await Promise.all([database.getAll('people'), database.getAll('candles')]);
  const counts = new Map<string, number>();
  for (const candle of candles) counts.set(candle.personId, (counts.get(candle.personId) ?? 0) + 1);
  return people.map((p) => ({ ...p, candles: counts.get(p.id) ?? 0 }));
}

export async function getPersonBySlug(slug: string): Promise<Person | null> {
  return (await (await db()).getFromIndex('people', 'slug', slug)) ?? null;
}

const byOrder = (a: { order: number; createdAt: string }, b: { order: number; createdAt: string }) =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt);
const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

export type MemorialContent = { albums: Album[]; photos: Photo[]; tributes: Tribute[]; candles: Candle[] };

export async function getMemorialContent(personId: string): Promise<MemorialContent> {
  const database = await db();
  const [albums, photos, tributes, candles] = await Promise.all([
    database.getAllFromIndex('albums', 'person', personId),
    database.getAllFromIndex('photos', 'person', personId),
    database.getAllFromIndex('tributes', 'person', personId),
    database.getAllFromIndex('candles', 'person', personId),
  ]);
  return { albums: albums.sort(byOrder), photos: photos.sort(byOrder), tributes: tributes.sort(newestFirst), candles: candles.sort(newestFirst) };
}

export async function getImage(id: string): Promise<StoredImage | null> {
  return (await (await db()).get('images', id)) ?? null;
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

async function uniqueSlug(name: string, ownId?: string): Promise<string> {
  const database = await db();
  const base = slugify(name);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const other = await database.getFromIndex('people', 'slug', slug);
    if (!other || other.id === ownId) return slug;
  }
}

function clean(details: PersonDetails): PersonDetails {
  return {
    name: details.name.trim(),
    knownAs: details.knownAs.trim(),
    birth: details.birth,
    death: details.death,
    country: details.country.trim(),
    home: details.home.trim(),
    story: details.story.replace(/\r\n/g, '\n').trim(),
  };
}

export async function createPerson(details: PersonDetails): Promise<Person> {
  const created = now();
  const fields = clean(details);
  const person: Person = { id: newId(), slug: await uniqueSlug(fields.name), ...fields, portraitId: null, createdAt: created, updatedAt: created };
  await (await db()).add('people', person);
  await touch();
  return person;
}

export async function updatePerson(id: string, details: PersonDetails): Promise<Person> {
  const database = await db();
  const previous = await database.get('people', id);
  if (!previous) throw new Error('not found');
  const fields = clean(details);
  const slug = fields.name === previous.name ? previous.slug : await uniqueSlug(fields.name, id);
  const person: Person = { ...previous, ...fields, slug, updatedAt: now() };
  await database.put('people', person);
  await touch();
  return person;
}

/** Removes a page with everything on it: albums, photos, words, candles and their images. */
export async function deletePerson(id: string): Promise<void> {
  const database = await db();
  const tx = database.transaction(['people', 'albums', 'photos', 'tributes', 'candles', 'images'], 'readwrite');
  const person = await tx.objectStore('people').get(id);
  const images = new Set<string>();
  if (person?.portraitId) images.add(person.portraitId);
  for (const name of ['albums', 'photos', 'tributes', 'candles'] as const) {
    const store = tx.objectStore(name);
    for (const row of await store.index('person').getAll(id)) {
      if ('imageId' in row && row.imageId) images.add(row.imageId);
      await store.delete(row.id);
    }
  }
  for (const imageId of images) await tx.objectStore('images').delete(imageId);
  await tx.objectStore('people').delete(id);
  await tx.done;
  await touch();
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

async function storeImage(file: File): Promise<string> {
  const prepared = await prepareImage(file);
  const image: StoredImage = { id: newId(), ...prepared, createdAt: now() };
  await (await db()).add('images', image);
  return image.id;
}

/** An image can be a photo and the portrait at the same time; it goes only when nothing uses it. */
async function deleteImageIfUnused(imageId: string | null): Promise<void> {
  if (!imageId) return;
  const database = await db();
  const [people, photos, tributes] = await Promise.all([database.getAll('people'), database.getAll('photos'), database.getAll('tributes')]);
  const used = people.some((p) => p.portraitId === imageId) || photos.some((p) => p.imageId === imageId) || tributes.some((t) => t.imageId === imageId);
  if (!used) await database.delete('images', imageId);
}

export async function setPortrait(personId: string, file: File): Promise<void> {
  const imageId = await storeImage(file);
  await setPortraitImage(personId, imageId);
}

export async function setPortraitImage(personId: string, imageId: string | null): Promise<void> {
  const database = await db();
  const person = await database.get('people', personId);
  if (!person) throw new Error('not found');
  const previous = person.portraitId;
  await database.put('people', { ...person, portraitId: imageId, updatedAt: now() });
  if (previous && previous !== imageId) await deleteImageIfUnused(previous);
  await touch();
}

// ---------------------------------------------------------------------------
// Photos and albums
// ---------------------------------------------------------------------------

export async function addPhotos(
  personId: string,
  files: File[],
  albumId: string | null,
  onProgress?: (done: number) => void,
): Promise<{ added: number; failed: string[] }> {
  const database = await db();
  const existing = await database.getAllFromIndex('photos', 'person', personId);
  let order = existing.reduce((max, p) => Math.max(max, p.order), -1) + 1;
  let added = 0;
  const failed: string[] = [];
  for (const file of files) {
    try {
      const imageId = await storeImage(file);
      const photo: Photo = { id: newId(), personId, albumId, imageId, caption: '', contributedBy: '', order: order++, createdAt: now() };
      await database.add('photos', photo);
      added += 1;
    } catch {
      failed.push(file.name);
    }
    onProgress?.(added + failed.length);
  }
  await touch();
  return { added, failed };
}

export async function updatePhoto(id: string, patch: Partial<Pick<Photo, 'caption' | 'contributedBy' | 'albumId'>>): Promise<void> {
  const database = await db();
  const photo = await database.get('photos', id);
  if (!photo) return;
  await database.put('photos', { ...photo, ...patch, caption: (patch.caption ?? photo.caption).trim(), contributedBy: (patch.contributedBy ?? photo.contributedBy).trim() });
  await touch();
}

/** Moves a photo one place up or down within its album. */
export async function movePhoto(id: string, direction: -1 | 1): Promise<void> {
  const database = await db();
  const photo = await database.get('photos', id);
  if (!photo) return;
  const siblings = (await database.getAllFromIndex('photos', 'person', photo.personId)).filter((p) => p.albumId === photo.albumId).sort(byOrder);
  const index = siblings.findIndex((p) => p.id === id);
  const other = siblings[index + direction];
  if (!other) return;
  [siblings[index], siblings[index + direction]] = [other, photo];
  const tx = database.transaction('photos', 'readwrite');
  siblings.forEach((p, i) => tx.store.put({ ...p, order: i }));
  await tx.done;
  await touch();
}

export async function deletePhoto(id: string): Promise<void> {
  const database = await db();
  const photo = await database.get('photos', id);
  if (!photo) return;
  await database.delete('photos', id);
  await deleteImageIfUnused(photo.imageId);
  await touch();
}

export async function createAlbum(personId: string, title: string, description: string): Promise<Album> {
  const database = await db();
  const existing = await database.getAllFromIndex('albums', 'person', personId);
  const album: Album = {
    id: newId(),
    personId,
    title: title.trim(),
    description: description.trim(),
    order: existing.reduce((max, a) => Math.max(max, a.order), -1) + 1,
    createdAt: now(),
  };
  await database.add('albums', album);
  await touch();
  return album;
}

export async function updateAlbum(id: string, title: string, description: string): Promise<void> {
  const database = await db();
  const album = await database.get('albums', id);
  if (!album) return;
  await database.put('albums', { ...album, title: title.trim(), description: description.trim() });
  await touch();
}

/** The album goes; its photos stay on the page, without an album. */
export async function deleteAlbum(id: string): Promise<void> {
  const database = await db();
  const tx = database.transaction(['albums', 'photos'], 'readwrite');
  const album = await tx.objectStore('albums').get(id);
  if (album) {
    for (const photo of await tx.objectStore('photos').index('person').getAll(album.personId)) {
      if (photo.albumId === id) await tx.objectStore('photos').put({ ...photo, albumId: null });
    }
    await tx.objectStore('albums').delete(id);
  }
  await tx.done;
  await touch();
}

// ---------------------------------------------------------------------------
// Words and candles
// ---------------------------------------------------------------------------

export type TributeInput = { author: string; relation: string; message: string };

export async function addTribute(personId: string, input: TributeInput, file: File | null): Promise<void> {
  const imageId = file ? await storeImage(file) : null;
  const created = now();
  const tribute: Tribute = {
    id: newId(),
    personId,
    author: input.author.trim(),
    relation: input.relation.trim(),
    message: input.message.replace(/\r\n/g, '\n').trim(),
    imageId,
    createdAt: created,
    updatedAt: created,
  };
  await (await db()).add('tributes', tribute);
  await touch();
}

export async function updateTribute(id: string, input: TributeInput, image: { file: File } | { remove: true } | null): Promise<void> {
  const database = await db();
  const tribute = await database.get('tributes', id);
  if (!tribute) return;
  let imageId = tribute.imageId;
  if (image && 'file' in image) imageId = await storeImage(image.file);
  if (image && 'remove' in image) imageId = null;
  await database.put('tributes', {
    ...tribute,
    author: input.author.trim(),
    relation: input.relation.trim(),
    message: input.message.replace(/\r\n/g, '\n').trim(),
    imageId,
    updatedAt: now(),
  });
  if (tribute.imageId !== imageId) await deleteImageIfUnused(tribute.imageId);
  await touch();
}

export async function deleteTribute(id: string): Promise<void> {
  const database = await db();
  const tribute = await database.get('tributes', id);
  if (!tribute) return;
  await database.delete('tributes', id);
  await deleteImageIfUnused(tribute.imageId);
  await touch();
}

export async function lightCandle(personId: string, name: string, message: string): Promise<void> {
  const candle: Candle = { id: newId(), personId, name: name.trim(), message: message.trim(), createdAt: now() };
  await (await db()).add('candles', candle);
  await touch();
}

export async function deleteCandle(id: string): Promise<void> {
  await (await db()).delete('candles', id);
  await touch();
}

// ---------------------------------------------------------------------------
// Settings and housekeeping
// ---------------------------------------------------------------------------

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('meta', key))?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await (await db()).put('meta', { key, value });
}

/** Records that something changed (for the backup reminder) and tells every open page. */
async function touch(): Promise<void> {
  await setMeta('lastChangeAt', now());
  changed();
  // Ask the browser not to clear this site's data on its own when space runs low.
  navigator.storage?.persist?.().catch(() => undefined);
}

export function sortPeople(people: PersonListItem[], order: 'name' | 'death' | 'added'): PersonListItem[] {
  const sorted = [...people];
  if (order === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
  if (order === 'death') sorted.sort((a, b) => sortKey(b.death) - sortKey(a.death) || a.name.localeCompare(b.name));
  if (order === 'added') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return sorted;
}
