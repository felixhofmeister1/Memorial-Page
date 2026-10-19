import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { memorials } from '@/content/memorials';
import { SLUG_PATTERN } from '@/lib/slug';
import type {
  AlbumRow,
  CandleRow,
  MemorialRequestRow,
  PersonRow,
  PhotoRow,
  TributeRow,
} from '@/lib/supabase/database.types';

/*
 * Local mode storage: one JSON file plus image folders under data/ (see src/lib/mode.ts).
 * The records have exactly the same shape as the database tables, so moving to Supabase
 * later is a matter of importing them. The rules the database enforces with triggers
 * (consent before publishing, admin confirmation for minors, moderation, candle counts)
 * are enforced here too.
 */

export type StoreData = {
  version: 1;
  people: PersonRow[];
  albums: AlbumRow[];
  photos: PhotoRow[];
  tributes: TributeRow[];
  candles: CandleRow[];
  requests: MemorialRequestRow[];
};

/** Error shaped like a database error, so the admin's error messages work unchanged. */
export class RuleError extends Error {
  constructor(
    message: string,
    public code: string,
    public hint: string | null = null,
  ) {
    super(message);
  }
}

export const LOCAL_USER_ID = '00000000-0000-4000-8000-00000000c0de';

export function dataDir(): string {
  // Read at run time only: the bundler must not trace (or ship) this folder.
  return path.resolve(/*turbopackIgnore: true*/ process.env.MEMORIAL_DATA_DIR ?? path.join(process.cwd(), 'data'));
}

function storeFile() {
  return path.join(dataDir(), 'memorials.json');
}

const now = () => new Date().toISOString();

/** First run: start from the pages in src/content/memorials.ts. */
function seedFromContent(): StoreData {
  const data: StoreData = { version: 1, people: [], albums: [], photos: [], tributes: [], candles: [], requests: [] };
  const created = now();
  for (const m of memorials) {
    data.people.push({
      id: m.id,
      slug: m.slug,
      name: m.name,
      known_as: m.known_as,
      birth_date: m.birth_date,
      birth_date_precision: m.birth_date_precision,
      death_date: m.death_date,
      death_date_precision: m.death_date_precision,
      country: m.country,
      home: m.home,
      story: m.story,
      story_lang: m.story_lang,
      portrait_url: m.portrait_url,
      status: 'published',
      consent_confirmed: true,
      consent_note: m.sample ? 'Test page.' : null,
      minor: false,
      minor_confirmed_by: null,
      minor_confirmed_at: null,
      sample: m.sample,
      candle_count: m.candle_count,
      published_at: created,
      created_by: null,
      created_at: created,
      updated_at: created,
    });
    m.albums.forEach((album, i) => {
      data.albums.push({ id: album.id, person_id: m.id, title: album.title, description: album.description, sort_order: i, created_at: created });
      album.photos.forEach((p, j) =>
        data.photos.push({
          ...p,
          person_id: m.id,
          album_id: album.id,
          status: 'approved',
          hidden: false,
          sort_order: j,
          created_at: created,
        }),
      );
    });
    for (const t of m.tributes) {
      data.tributes.push({
        ...t,
        person_id: m.id,
        status: 'approved',
        hidden: false,
        moderated_by: null,
        moderated_at: t.created_at,
        locale: null,
      });
    }
    for (const c of m.candles) {
      data.candles.push({ ...c, person_id: m.id, message_status: 'approved', hidden: false });
    }
    // Quiet candles (no name, no words) that make up the rest of the count
    for (let i = m.candles.length; i < m.candle_count; i++) {
      data.candles.push({
        id: `${m.id}-quiet-${i}`,
        person_id: m.id,
        author_name: null,
        message: null,
        message_status: 'approved',
        hidden: false,
        created_at: created,
      });
    }
  }
  return data;
}

async function save(data: StoreData) {
  await fs.mkdir(dataDir(), { recursive: true });
  // Write a temporary file and rename it: the store is never left half-written.
  const tmp = `${storeFile()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, storeFile());
}

export async function readStore(): Promise<StoreData> {
  try {
    return JSON.parse(await fs.readFile(storeFile(), 'utf8')) as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const seeded = seedFromContent();
    await save(seeded);
    return seeded;
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** Applies one change at a time. `change` edits `data` in place; nothing is saved if it throws. */
export function updateStore<T>(change: (data: StoreData) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const data = await readStore();
    const result = await change(data);
    await save(data);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

// ---------------------------------------------------------------------------
// Rules (the same as the database triggers in supabase/migrations)
// ---------------------------------------------------------------------------

/** Checks and completes a person record before it is saved. */
export function applyPersonRules(data: StoreData, next: PersonRow, previous?: PersonRow): PersonRow {
  if (!SLUG_PATTERN.test(next.slug) || next.slug.length > 80 || ['request', 'new'].includes(next.slug)) {
    throw new RuleError('slug check failed', '23514');
  }
  if (data.people.some((p) => p.slug === next.slug && p.id !== next.id)) {
    throw new RuleError('slug already used', '23505');
  }
  if (next.birth_date && next.death_date && next.death_date < next.birth_date) {
    throw new RuleError('violates check constraint people_dates_in_order', '23514');
  }
  if (next.status === 'published') {
    if (!next.consent_confirmed) throw new RuleError('consent required', '23514', 'consent_required');
    if (next.minor && !next.minor_confirmed_at) {
      throw new RuleError('minor confirmation required', '23514', 'minor_confirmation_required');
    }
    if (!previous || previous.status !== 'published') next.published_at = next.published_at ?? now();
  }
  next.updated_at = now();
  return next;
}

/** Candle counts follow the candles, as in the database. */
export function recountCandles(data: StoreData, personId: string) {
  const person = data.people.find((p) => p.id === personId);
  if (person) person.candle_count = data.candles.filter((c) => c.person_id === personId && !c.hidden).length;
}
