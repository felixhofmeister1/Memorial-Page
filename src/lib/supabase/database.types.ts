// Types for supabase/migrations/20261002120000_memorial_schema.sql.
// After changing the schema, regenerate with:
//   npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
// (or keep this file in sync by hand; it is small).

export type MemorialStatus = 'draft' | 'pending' | 'published';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type StaffRole = 'admin' | 'editor';
export type RequestStatus = 'new' | 'in_progress' | 'accepted' | 'declined';
export type DatePrecision = 'day' | 'month' | 'year';

type PersonRelation<Name extends string> = [
  {
    foreignKeyName: Name;
    columns: ['person_id'];
    isOneToOne: false;
    referencedRelation: 'people';
    referencedColumns: ['id'];
  },
];

type Table<Row, Insert = Partial<Row>, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type PersonRow = {
  id: string;
  slug: string;
  name: string;
  known_as: string | null;
  birth_date: string | null;
  birth_date_precision: DatePrecision;
  death_date: string | null;
  death_date_precision: DatePrecision;
  country: string | null;
  home: string | null;
  story: string | null;
  story_lang: string | null;
  portrait_url: string | null;
  status: MemorialStatus;
  consent_confirmed: boolean;
  consent_note: string | null;
  minor: boolean;
  minor_confirmed_by: string | null;
  minor_confirmed_at: string | null;
  sample: boolean;
  candle_count: number;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AlbumRow = {
  id: string;
  person_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type PhotoRow = {
  id: string;
  person_id: string;
  album_id: string | null;
  storage_path: string;
  thumb_path: string | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  contributed_by: string | null;
  status: ModerationStatus;
  hidden: boolean;
  sort_order: number;
  created_at: string;
};

export type TributeRow = {
  id: string;
  person_id: string;
  author_name: string;
  author_relation: string | null;
  message: string;
  photo_url: string | null;
  status: ModerationStatus;
  hidden: boolean;
  moderated_by: string | null;
  moderated_at: string | null;
  locale: string | null;
  created_at: string;
};

export type CandleRow = {
  id: string;
  person_id: string;
  author_name: string | null;
  message: string | null;
  message_status: ModerationStatus;
  hidden: boolean;
  created_at: string;
};

export type MemorialRequestRow = {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_relation: string;
  person_name: string;
  birth_date: string | null;
  death_date: string | null;
  country: string | null;
  home: string | null;
  story: string | null;
  photo_path: string | null;
  is_minor: boolean;
  family_informed: boolean;
  status: RequestStatus;
  staff_note: string | null;
  person_id: string | null;
  locale: string | null;
  created_at: string;
};

export type AdminUserRow = {
  user_id: string;
  role: StaffRole;
  display_name: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      people: Table<PersonRow, Partial<PersonRow> & Pick<PersonRow, 'slug' | 'name'>>;
      albums: Table<AlbumRow, Partial<AlbumRow> & Pick<AlbumRow, 'person_id' | 'title'>, PersonRelation<'albums_person_id_fkey'>>;
      photos: Table<PhotoRow, Partial<PhotoRow> & Pick<PhotoRow, 'person_id' | 'storage_path'>, PersonRelation<'photos_person_id_fkey'>>;
      tributes: Table<
        TributeRow,
        Partial<TributeRow> & Pick<TributeRow, 'person_id' | 'author_name' | 'message'>,
        PersonRelation<'tributes_person_id_fkey'>
      >;
      candles: Table<CandleRow, Partial<CandleRow> & Pick<CandleRow, 'person_id'>, PersonRelation<'candles_person_id_fkey'>>;
      memorial_requests: Table<
        MemorialRequestRow,
        Partial<MemorialRequestRow> &
          Pick<MemorialRequestRow, 'requester_name' | 'requester_email' | 'requester_relation' | 'person_name'>
      >;
      admin_users: Table<AdminUserRow, Partial<AdminUserRow> & Pick<AdminUserRow, 'user_id'>>;
    };
    Views: Record<string, never>;
    Functions: {
      hit_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_staff_role: { Args: Record<string, never>; Returns: StaffRole | null };
    };
    Enums: {
      memorial_status: MemorialStatus;
      moderation_status: ModerationStatus;
      staff_role: StaffRole;
      request_status: RequestStatus;
      date_precision: DatePrecision;
    };
    CompositeTypes: Record<string, never>;
  };
};
