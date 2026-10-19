import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Album, Candle, Person, Photo, StoredImage, Tribute } from './types';

/*
 * Everything is kept in this browser's IndexedDB, under the site's own address.
 * Nothing is sent anywhere. The backup file (backup.ts) is the way to keep a copy.
 */

interface RememberedDB extends DBSchema {
  people: { key: string; value: Person; indexes: { slug: string } };
  albums: { key: string; value: Album; indexes: { person: string } };
  photos: { key: string; value: Photo; indexes: { person: string } };
  tributes: { key: string; value: Tribute; indexes: { person: string } };
  candles: { key: string; value: Candle; indexes: { person: string } };
  images: { key: string; value: StoredImage };
  meta: { key: string; value: { key: string; value: unknown } };
}

export type Store = 'people' | 'albums' | 'photos' | 'tributes' | 'candles' | 'images' | 'meta';
export const DATA_STORES = ['people', 'albums', 'photos', 'tributes', 'candles', 'images'] as const;

let opening: Promise<IDBPDatabase<RememberedDB>> | null = null;

export function db(): Promise<IDBPDatabase<RememberedDB>> {
  opening ??= openDB<RememberedDB>('remembered', 1, {
    upgrade(database) {
      database.createObjectStore('people', { keyPath: 'id' }).createIndex('slug', 'slug', { unique: true });
      for (const name of ['albums', 'photos', 'tributes', 'candles'] as const) {
        database.createObjectStore(name, { keyPath: 'id' }).createIndex('person', 'personId');
      }
      database.createObjectStore('images', { keyPath: 'id' });
      database.createObjectStore('meta', { keyPath: 'key' });
    },
    blocked() {
      // Another tab still has the old version open; reloading that tab lets this one continue.
    },
  });
  opening.catch(() => (opening = null));
  return opening;
}

// ---------------------------------------------------------------------------
// Change notices: pages reload what they show after any change, in this tab and in others.
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('remembered') : null;
channel?.addEventListener('message', () => listeners.forEach((l) => l()));

export function onChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function changed(): void {
  listeners.forEach((l) => l());
  channel?.postMessage('changed');
}

export const newId = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
