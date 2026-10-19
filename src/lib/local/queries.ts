import 'server-only';
import type { PersonSummary, PublicAlbum, PublicCandle, PublicPerson, PublicPhoto, PublicTribute } from '@/lib/data/types';
import type { CandleRow, PersonRow, TributeRow } from '@/lib/supabase/database.types';
import { readStore } from './store';

/* Reads from the local store, returning the same shapes as the database queries. */

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
const newestFirst = (a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at);
const bySortOrder = (a: { sort_order: number; created_at: string }, b: { sort_order: number; created_at: string }) =>
  a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);

function summary(p: PersonRow): PersonSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    known_as: p.known_as,
    birth_date: p.birth_date,
    birth_date_precision: p.birth_date_precision,
    death_date: p.death_date,
    death_date_precision: p.death_date_precision,
    country: p.country,
    home: p.home,
    portrait_url: p.portrait_url,
    sample: p.sample,
    candle_count: p.candle_count,
  };
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export async function localPublishedPeople(): Promise<PersonSummary[]> {
  const data = await readStore();
  return data.people.filter((p) => p.status === 'published').map(summary).sort(byName);
}

export async function localPublishedPerson(slug: string): Promise<PublicPerson | null> {
  const data = await readStore();
  const p = data.people.find((x) => x.slug === slug && x.status === 'published');
  return p ? { ...summary(p), story: p.story, story_lang: p.story_lang } : null;
}

/** What a memorial page shows: approved, not hidden. */
export async function localMemorialContent(
  personId: string,
): Promise<{ albums: PublicAlbum[]; tributes: PublicTribute[]; candles: PublicCandle[] }> {
  const data = await readStore();
  const photos: PublicPhoto[] = data.photos
    .filter((p) => p.person_id === personId && p.status === 'approved' && !p.hidden)
    .sort(bySortOrder)
    .map(({ id, album_id, storage_path, thumb_path, width, height, caption, contributed_by }) => ({
      id,
      album_id,
      storage_path,
      thumb_path,
      width,
      height,
      caption,
      contributed_by,
    }));
  const albums: PublicAlbum[] = data.albums
    .filter((a) => a.person_id === personId)
    .sort(bySortOrder)
    .map((a) => ({ id: a.id, title: a.title, description: a.description, photos: photos.filter((p) => p.album_id === a.id) }));
  const loose = photos.filter((p) => !p.album_id || !albums.some((a) => a.id === p.album_id));
  if (loose.length > 0) albums.push({ id: 'loose', title: '', description: null, photos: loose });

  const tributes: PublicTribute[] = data.tributes
    .filter((t) => t.person_id === personId && t.status === 'approved' && !t.hidden)
    .sort(newestFirst)
    .map(({ id, author_name, author_relation, message, photo_url, created_at }) => ({
      id,
      author_name,
      author_relation,
      message,
      photo_url,
      created_at,
    }));
  const candles: PublicCandle[] = data.candles
    .filter((c) => c.person_id === personId && c.message_status === 'approved' && !c.hidden && (c.author_name || c.message))
    .sort(newestFirst)
    .slice(0, 12)
    .map(({ id, author_name, message, created_at }) => ({ id, author_name, message, created_at }));

  return { albums: albums.filter((a) => a.photos.length > 0), tributes, candles };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

type WithPerson<T> = T & { people: { name: string; slug: string } | null };

function withPerson<T extends { person_id: string }>(rows: T[], people: PersonRow[]): WithPerson<T>[] {
  return rows.map((row) => {
    const p = people.find((x) => x.id === row.person_id);
    return { ...row, people: p ? { name: p.name, slug: p.slug } : null };
  });
}

export async function localDashboardCounts() {
  const data = await readStore();
  return {
    tributes: data.tributes.filter((t) => t.status === 'pending').length,
    candles: data.candles.filter((c) => c.message_status === 'pending').length,
    requests: data.requests.filter((r) => r.status === 'new').length,
    unpublished: data.people.filter((p) => p.status !== 'published').length,
  };
}

export async function localListMemorials() {
  const data = await readStore();
  return [...data.people].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function localMemorialMedia(personId: string) {
  const data = await readStore();
  return {
    albums: data.albums.filter((a) => a.person_id === personId).sort(bySortOrder),
    photos: data.photos.filter((p) => p.person_id === personId).sort(bySortOrder),
  };
}

export async function localKnownHomes(): Promise<string[]> {
  const data = await readStore();
  return [...new Set(data.people.map((p) => p.home).filter((h): h is string => !!h))].sort((a, b) => a.localeCompare(b));
}

export async function localPendingTributes(): Promise<WithPerson<TributeRow>[]> {
  const data = await readStore();
  const rows = data.tributes.filter((t) => t.status === 'pending').sort((a, b) => a.created_at.localeCompare(b.created_at));
  return withPerson(rows.slice(0, 100), data.people);
}

export async function localRecentTributes(): Promise<WithPerson<TributeRow>[]> {
  const data = await readStore();
  const rows = data.tributes
    .filter((t) => t.status !== 'pending')
    .sort((a, b) => (b.moderated_at ?? '').localeCompare(a.moderated_at ?? ''));
  return withPerson(rows.slice(0, 40), data.people);
}

export async function localPendingCandles(): Promise<WithPerson<CandleRow>[]> {
  const data = await readStore();
  const rows = data.candles.filter((c) => c.message_status === 'pending').sort((a, b) => a.created_at.localeCompare(b.created_at));
  return withPerson(rows.slice(0, 200), data.people);
}

export async function localListRequests() {
  const data = await readStore();
  return [...data.requests].sort(newestFirst);
}
