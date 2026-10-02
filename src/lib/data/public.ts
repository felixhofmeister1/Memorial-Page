import 'server-only';
import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/clients';
import type { AlbumRow, CandleRow, PersonRow, PhotoRow, TributeRow } from '@/lib/supabase/database.types';
import { yearOf } from '@/lib/dates';

// The anon role may only select these columns (see the migration's grants).
const PERSON_SUMMARY = 'id, slug, name, known_as, birth_date, birth_date_precision, death_date, death_date_precision, country, home, portrait_url, sample';
const PERSON_FULL = `${PERSON_SUMMARY}, story, story_lang, candle_count`;

export type PersonSummary = Pick<
  PersonRow,
  | 'id'
  | 'slug'
  | 'name'
  | 'known_as'
  | 'birth_date'
  | 'birth_date_precision'
  | 'death_date'
  | 'death_date_precision'
  | 'country'
  | 'home'
  | 'portrait_url'
  | 'sample'
>;
export type PublicPerson = PersonSummary & Pick<PersonRow, 'story' | 'story_lang' | 'candle_count'>;
export type PublicPhoto = Pick<PhotoRow, 'id' | 'album_id' | 'storage_path' | 'thumb_path' | 'width' | 'height' | 'caption' | 'contributed_by'>;
export type PublicAlbum = Pick<AlbumRow, 'id' | 'title' | 'description'> & { photos: PublicPhoto[] };
export type PublicTribute = Pick<TributeRow, 'id' | 'author_name' | 'author_relation' | 'message' | 'photo_url' | 'created_at'>;
export type PublicCandle = Pick<CandleRow, 'id' | 'author_name' | 'message' | 'created_at'>;

export type OverviewFilters = { q?: string; country?: string; home?: string; year?: string };

/** Lowercase, without accents: "José" and "jose" find the same person. */
export function normalizeForSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export const listPublishedPeople = cache(async (): Promise<PersonSummary[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('people')
    .select(PERSON_SUMMARY)
    .eq('status', 'published')
    .order('name', { ascending: true })
    .returns<PersonSummary[]>();
  if (error) throw error;
  return data ?? [];
});

/**
 * Filtering happens here rather than in SQL: the list is small (hundreds at most),
 * and accent-insensitive search is simpler and more reliable this way.
 */
export function filterPeople(people: PersonSummary[], filters: OverviewFilters): PersonSummary[] {
  const q = filters.q ? normalizeForSearch(filters.q) : '';
  return people.filter((person) => {
    if (q && !normalizeForSearch(person.name).includes(q)) return false;
    if (filters.country && person.country !== filters.country) return false;
    if (filters.home && person.home !== filters.home) return false;
    if (filters.year && String(yearOf(person.death_date)) !== filters.year) return false;
    return true;
  });
}

export function filterOptions(people: PersonSummary[]) {
  const countries = new Set<string>();
  const homes = new Set<string>();
  const years = new Set<number>();
  for (const person of people) {
    if (person.country) countries.add(person.country);
    if (person.home) homes.add(person.home);
    const year = yearOf(person.death_date);
    if (year) years.add(year);
  }
  return {
    countries: [...countries],
    homes: [...homes].sort((a, b) => a.localeCompare(b)),
    years: [...years].sort((a, b) => b - a),
  };
}

export const getPublishedPerson = cache(async (slug: string): Promise<PublicPerson | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('people')
    .select(PERSON_FULL)
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<PublicPerson[]>()
    .maybeSingle();
  if (error) throw error;
  return data;
});

export async function getMemorialContent(personId: string) {
  const supabase = createPublicClient();
  const [albums, photos, tributes, candles] = await Promise.all([
    supabase.from('albums').select('id, title, description').eq('person_id', personId).order('sort_order').order('created_at'),
    supabase
      .from('photos')
      .select('id, album_id, storage_path, thumb_path, width, height, caption, contributed_by')
      .eq('person_id', personId)
      .eq('status', 'approved')
      .eq('hidden', false)
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('tributes')
      .select('id, author_name, author_relation, message, photo_url, created_at')
      .eq('person_id', personId)
      .eq('status', 'approved')
      .eq('hidden', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('candles')
      .select('id, author_name, message, created_at')
      .eq('person_id', personId)
      .eq('message_status', 'approved')
      .eq('hidden', false)
      .or('author_name.not.is.null,message.not.is.null')
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  for (const result of [albums, photos, tributes, candles]) {
    if (result.error) throw result.error;
  }

  const allPhotos = (photos.data ?? []) as PublicPhoto[];
  const albumList: PublicAlbum[] = ((albums.data ?? []) as PublicAlbum[]).map((album) => ({
    ...album,
    photos: allPhotos.filter((photo) => photo.album_id === album.id),
  }));
  const loose = allPhotos.filter((photo) => !photo.album_id || !albumList.some((a) => a.id === photo.album_id));
  if (loose.length > 0) {
    albumList.push({ id: 'loose', title: '', description: null, photos: loose });
  }

  return {
    albums: albumList.filter((album) => album.photos.length > 0),
    tributes: (tributes.data ?? []) as PublicTribute[],
    candles: (candles.data ?? []) as PublicCandle[],
  };
}

/** The name used in running text: what people called them, else the first name. */
export function shortName(person: Pick<PersonRow, 'name' | 'known_as'>): string {
  return person.known_as?.trim() || person.name.split(/\s+/)[0];
}
