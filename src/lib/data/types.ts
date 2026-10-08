import type { AlbumRow, CandleRow, PersonRow, PhotoRow, TributeRow } from '@/lib/supabase/database.types';

// What the public pages show. Filled either from the database or, before there is one,
// from src/content/memorials.ts.

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
  | 'candle_count'
>;
export type PublicPerson = PersonSummary & Pick<PersonRow, 'story' | 'story_lang'>;
export type PublicPhoto = Pick<
  PhotoRow,
  'id' | 'album_id' | 'storage_path' | 'thumb_path' | 'width' | 'height' | 'caption' | 'contributed_by'
>;
export type PublicAlbum = Pick<AlbumRow, 'id' | 'title' | 'description'> & { photos: PublicPhoto[] };
export type PublicTribute = Pick<TributeRow, 'id' | 'author_name' | 'author_relation' | 'message' | 'photo_url' | 'created_at'>;
export type PublicCandle = Pick<CandleRow, 'id' | 'author_name' | 'message' | 'created_at'>;

/** One memorial with everything shown on its page. */
export type MemorialContent = PublicPerson & {
  albums: PublicAlbum[];
  tributes: PublicTribute[];
  candles: PublicCandle[];
};
