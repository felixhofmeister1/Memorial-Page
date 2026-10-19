import 'server-only';
import crypto from 'node:crypto';
import type {
  AlbumRow,
  CandleRow,
  MemorialRequestRow,
  PersonRow,
  PhotoRow,
  TributeRow,
} from '@/lib/supabase/database.types';
import { applyPersonRules, LOCAL_USER_ID, readStore, recountCandles, RuleError, updateStore, type StoreData } from './store';

/*
 * Table-like access to the local store, with the same side effects as the database:
 * deleting a memorial removes its albums, photos, tributes and candles; candle counts
 * follow the candles; changing a tribute's status records when it was moderated;
 * people records are checked against the publishing rules.
 */

type Tables = {
  people: PersonRow;
  albums: AlbumRow;
  photos: PhotoRow;
  tributes: TributeRow;
  candles: CandleRow;
  requests: MemorialRequestRow;
};
export type TableName = keyof Tables;

const now = () => new Date().toISOString();

export async function localGet<K extends TableName>(table: K, id: string): Promise<Tables[K] | null> {
  const data = await readStore();
  return ((data[table] as Tables[K][]).find((row) => row.id === id) ?? null) as Tables[K] | null;
}

export async function localInsert<K extends TableName>(table: K, row: Tables[K]): Promise<Tables[K]> {
  return updateStore((data) => {
    if (table === 'people') applyPersonRules(data, row as PersonRow);
    (data[table] as Tables[K][]).push(row);
    if (table === 'candles') recountCandles(data, (row as CandleRow).person_id);
    return row;
  });
}

export async function localUpdate<K extends TableName>(table: K, id: string, patch: Partial<Tables[K]>): Promise<Tables[K]> {
  return updateStore((data) => {
    const rows = data[table] as Tables[K][];
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) throw new RuleError('not found', 'PGRST116');
    const previous = rows[index];
    const next = { ...previous, ...patch } as Tables[K];

    if (table === 'people') applyPersonRules(data, next as PersonRow, previous as PersonRow);
    if (table === 'tributes' && (next as TributeRow).status !== (previous as TributeRow).status) {
      (next as TributeRow).moderated_by = LOCAL_USER_ID;
      (next as TributeRow).moderated_at = now();
    }
    rows[index] = next;
    if (table === 'candles') recountCandles(data, (next as CandleRow).person_id);
    return next;
  });
}

export async function localDelete<K extends TableName>(table: K, id: string): Promise<Tables[K] | null> {
  return updateStore((data) => {
    const rows = data[table] as Tables[K][];
    const row = rows.find((r) => r.id === id) ?? null;
    if (!row) return null;
    (data as unknown as Record<TableName, Tables[K][]>)[table] = rows.filter((r) => r.id !== id);
    cascade(data, table, row);
    return row;
  });
}

function cascade(data: StoreData, table: TableName, row: { id: string }) {
  if (table === 'people') {
    data.albums = data.albums.filter((a) => a.person_id !== row.id);
    data.photos = data.photos.filter((p) => p.person_id !== row.id);
    data.tributes = data.tributes.filter((t) => t.person_id !== row.id);
    data.candles = data.candles.filter((c) => c.person_id !== row.id);
    data.requests = data.requests.map((r) => (r.person_id === row.id ? { ...r, person_id: null } : r));
  }
  if (table === 'albums') {
    // Photos stay; they leave the album.
    data.photos = data.photos.map((p) => (p.album_id === row.id ? { ...p, album_id: null } : p));
  }
  if (table === 'candles') recountCandles(data, (row as CandleRow).person_id);
}

// ---------------------------------------------------------------------------
// New rows with the same defaults as the database
// ---------------------------------------------------------------------------

export function newPerson(fields: Pick<PersonRow, 'name' | 'slug'> & Partial<PersonRow>): PersonRow {
  const created = now();
  return {
    id: crypto.randomUUID(),
    known_as: null,
    birth_date: null,
    birth_date_precision: 'day',
    death_date: null,
    death_date_precision: 'day',
    country: null,
    home: null,
    story: null,
    story_lang: null,
    portrait_url: null,
    status: 'draft',
    consent_confirmed: false,
    consent_note: null,
    minor: false,
    minor_confirmed_by: null,
    minor_confirmed_at: null,
    sample: false,
    candle_count: 0,
    published_at: null,
    created_by: LOCAL_USER_ID,
    created_at: created,
    updated_at: created,
    ...fields,
  };
}

export function newAlbum(fields: Pick<AlbumRow, 'person_id' | 'title'> & Partial<AlbumRow>): AlbumRow {
  return { id: crypto.randomUUID(), description: null, sort_order: 0, created_at: now(), ...fields };
}

export function newPhoto(fields: Pick<PhotoRow, 'person_id' | 'storage_path'> & Partial<PhotoRow>): PhotoRow {
  return {
    id: crypto.randomUUID(),
    album_id: null,
    thumb_path: null,
    width: null,
    height: null,
    caption: null,
    contributed_by: null,
    status: 'pending',
    hidden: false,
    sort_order: 0,
    created_at: now(),
    ...fields,
  };
}

export function newTribute(fields: Pick<TributeRow, 'person_id' | 'author_name' | 'message'> & Partial<TributeRow>): TributeRow {
  return {
    id: crypto.randomUUID(),
    author_relation: null,
    photo_url: null,
    status: 'pending',
    hidden: false,
    moderated_by: null,
    moderated_at: null,
    locale: null,
    created_at: now(),
    ...fields,
  };
}

export function newCandle(fields: Pick<CandleRow, 'person_id'> & Partial<CandleRow>): CandleRow {
  const words = Boolean(fields.author_name || fields.message);
  return {
    id: crypto.randomUUID(),
    author_name: null,
    message: null,
    // Quiet candles count at once; a name or words are read first.
    message_status: words ? 'pending' : 'approved',
    hidden: false,
    created_at: now(),
    ...fields,
  };
}

export function newRequest(
  fields: Pick<MemorialRequestRow, 'requester_name' | 'requester_email' | 'requester_relation' | 'person_name'> &
    Partial<MemorialRequestRow>,
): MemorialRequestRow {
  return {
    id: crypto.randomUUID(),
    requester_phone: null,
    birth_date: null,
    death_date: null,
    country: null,
    home: null,
    story: null,
    photo_path: null,
    is_minor: false,
    family_informed: false,
    status: 'new',
    staff_note: null,
    person_id: null,
    locale: null,
    created_at: now(),
    ...fields,
  };
}
