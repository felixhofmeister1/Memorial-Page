/*
 * Copies what local mode saved (data/memorials.json, data/media, data/uploads) into Supabase.
 *
 *   npm run import-local
 *
 * Run it once the database is set up (README "Deploying"), with SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY in .env.local. Running it again is safe: rows that are already
 * in the database are left alone.
 */
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.');
  process.exit(1);
}

const dir = path.resolve(process.env.MEMORIAL_DATA_DIR ?? 'data');
let data;
try {
  data = JSON.parse(await fs.readFile(path.join(dir, 'memorials.json'), 'utf8'));
} catch {
  console.error(`Nothing to import: ${path.join(dir, 'memorials.json')} was not found.`);
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

// Pages that came from src/content/memorials.ts may have ids that are not UUIDs.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const newIds = new Map();
const id = (value) => {
  if (value == null || UUID.test(value)) return value;
  if (!newIds.has(value)) newIds.set(value, crypto.randomUUID());
  return newIds.get(value);
};

// Local mode has no user accounts, so "created by" and "moderated by" are left empty.
// The candle counter starts at 0: the database counts the candles as they are added.
const tables = [
  ['people', data.people.map((p) => ({ ...p, id: id(p.id), created_by: null, minor_confirmed_by: null, candle_count: 0 }))],
  ['albums', data.albums.map((a) => ({ ...a, id: id(a.id), person_id: id(a.person_id) }))],
  ['photos', data.photos.map((p) => ({ ...p, id: id(p.id), person_id: id(p.person_id), album_id: id(p.album_id) }))],
  ['tributes', data.tributes.map((t) => ({ ...t, id: id(t.id), person_id: id(t.person_id), moderated_by: null }))],
  ['candles', data.candles.map((c) => ({ ...c, id: id(c.id), person_id: id(c.person_id) }))],
  ['memorial_requests', data.requests.map((r) => ({ ...r, person_id: id(r.person_id) }))],
];

// Images first, so no page points at a picture that is not there yet.
const imagePaths = [
  ...data.people.map((p) => p.portrait_url),
  ...data.photos.map((p) => p.storage_path),
  ...data.tributes.map((t) => t.photo_url),
  ...data.requests.map((r) => r.photo_path),
].filter((p) => p && !p.startsWith('/')); // paths starting with / are files in public/

let files = 0;
for (const stored of imagePaths) {
  const [bucket, ...rest] = stored.split('/');
  const key = rest.join('/');
  for (const k of [key, key.replace(/\.jpg$/, '-thumb.jpg')]) {
    let bytes;
    try {
      bytes = await fs.readFile(path.join(dir, bucket, k));
    } catch {
      if (k === key) console.warn(`  missing file, skipped: ${bucket}/${k}`);
      continue;
    }
    const { error } = await db.storage
      .from(bucket)
      .upload(k, bytes, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true });
    if (error) throw new Error(`Could not upload ${bucket}/${k}: ${error.message}`);
    files++;
  }
}
console.log(`images: ${files} files`);

for (const [table, rows] of tables) {
  if (rows.length === 0) continue;
  const { data: added, error } = await db
    .from(table)
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    .select('id');
  if (error) {
    console.error(`${table}: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
    process.exit(1);
  }
  console.log(`${table}: ${added.length} added, ${rows.length - added.length} already there`);
}
console.log('Done. The site now shows these pages from the database.');
