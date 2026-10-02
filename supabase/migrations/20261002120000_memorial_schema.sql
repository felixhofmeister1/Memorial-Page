-- Memorial pages for former children and young people of NPH.
--
-- Rules this schema enforces on its own, whatever client talks to it:
--   * A memorial can only be published once consent_confirmed is true.
--   * A memorial of someone who died as a minor also needs an admin's confirmation.
--   * Tributes, photos and candle messages are only visible after moderation.
--   * The public can read published/approved content and insert tributes,
--     candles and memorial requests. Nothing else.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.memorial_status as enum ('draft', 'pending', 'published');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.staff_role as enum ('admin', 'editor');
create type public.request_status as enum ('new', 'in_progress', 'accepted', 'declined');
-- Many NPH children came without papers; often only the year is known.
create type public.date_precision as enum ('day', 'month', 'year');

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.staff_role not null default 'editor',
  display_name text check (display_name is null or length(display_name) <= 120),
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'People who may moderate and edit memorials. Admins can also publish memorials of minors and manage staff.';

create function public.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.admin_users where user_id = auth.uid()
$$;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin')
$$;

-- True for the app server (service role key) and for maintenance run directly in the
-- database (SQL editor, seed). Reads the request's role, not current_user, so it also
-- works inside security definer functions.
create function public.is_trusted_backend()
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when nullif(current_setting('request.jwt.claims', true), '') is not null
      then (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    else session_user <> 'authenticator'
      and coalesce(current_setting('role', true), 'none') not in ('anon', 'authenticated')
  end
$$;

-- ---------------------------------------------------------------------------
-- People (one memorial page each)
-- ---------------------------------------------------------------------------

create table public.people (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80 and slug not in ('request', 'new')),
  name text not null check (length(btrim(name)) between 1 and 200),
  -- What family and friends called them: 'Lupita', 'Toño'. Used in running text.
  known_as text check (known_as is null or length(btrim(known_as)) between 1 and 60),
  birth_date date,
  birth_date_precision public.date_precision not null default 'day',
  death_date date,
  death_date_precision public.date_precision not null default 'day',
  -- ISO 3166-1 alpha-2 (MX, HN, HT, NI, GT, SV, DO, BO, PE ...)
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  -- The NPH home, e.g. 'Casa San Salvador, Miacatlán'
  home text check (home is null or length(home) <= 200),
  story text check (story is null or length(story) <= 40000),
  -- Language the story is written in (BCP 47), so screen readers pronounce it correctly
  story_lang text check (story_lang is null or story_lang ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  -- 'media/<path>' in the public media bucket, or '/placeholders/...' for sample data
  portrait_url text,
  status public.memorial_status not null default 'draft',
  consent_confirmed boolean not null default false,
  consent_note text check (consent_note is null or length(consent_note) <= 4000),
  minor boolean not null default false,
  minor_confirmed_by uuid references auth.users (id) on delete set null,
  minor_confirmed_at timestamptz,
  sample boolean not null default false,
  candle_count integer not null default 0 check (candle_count >= 0),
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_dates_in_order check (death_date is null or birth_date is null or death_date >= birth_date)
);

comment on column public.people.consent_confirmed is
  'Family and NPH have agreed to this page. Required before publishing.';
comment on column public.people.minor is
  'Died before turning 18. Publishing then also needs minor_confirmed_at, which only an admin can set.';
comment on column public.people.consent_note is
  'Internal: who agreed, when and how. Never shown publicly.';
comment on column public.people.sample is
  'Invented sample content shipped with the app. Delete these rows before going live.';

create index people_status_idx on public.people (status);
create index people_country_idx on public.people (country) where status = 'published';
create index people_death_date_idx on public.people (death_date) where status = 'published';

-- ---------------------------------------------------------------------------
-- Albums and photos (managed by staff)
-- ---------------------------------------------------------------------------

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text check (description is null or length(description) <= 2000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index albums_person_idx on public.albums (person_id, sort_order);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  album_id uuid references public.albums (id) on delete set null,
  -- 'media/<path>' or 'uploads/<path>' (not yet approved) or '/placeholders/...'
  storage_path text not null,
  thumb_path text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  caption text check (caption is null or length(caption) <= 1000),
  contributed_by text check (contributed_by is null or length(contributed_by) <= 120),
  status public.moderation_status not null default 'pending',
  hidden boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index photos_person_idx on public.photos (person_id, album_id, sort_order);

-- ---------------------------------------------------------------------------
-- Tributes
-- ---------------------------------------------------------------------------

create table public.tributes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  author_name text not null check (length(btrim(author_name)) between 1 and 120),
  -- e.g. 'his sister', 'volunteer in Miacatlán, 1998'
  author_relation text check (author_relation is null or length(author_relation) <= 120),
  message text not null check (length(btrim(message)) between 1 and 5000),
  photo_url text,
  status public.moderation_status not null default 'pending',
  hidden boolean not null default false,
  moderated_by uuid references auth.users (id) on delete set null,
  moderated_at timestamptz,
  locale text check (locale is null or locale in ('en', 'de', 'es')),
  created_at timestamptz not null default now()
);

create index tributes_person_idx on public.tributes (person_id, status, created_at desc);
create index tributes_pending_idx on public.tributes (created_at) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Candles
-- ---------------------------------------------------------------------------

create table public.candles (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  author_name text check (author_name is null or length(btrim(author_name)) between 1 and 80),
  message text check (message is null or length(btrim(message)) between 1 and 280),
  -- Candles without words count at once. A name or message is read by a person first.
  message_status public.moderation_status not null default 'pending',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index candles_person_idx on public.candles (person_id, created_at desc);
create index candles_pending_idx on public.candles (created_at) where message_status = 'pending';

-- ---------------------------------------------------------------------------
-- Memorial requests (from families and NPH staff)
-- ---------------------------------------------------------------------------

create table public.memorial_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null check (length(btrim(requester_name)) between 1 and 120),
  requester_email text not null check (requester_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(requester_email) <= 254),
  requester_phone text check (requester_phone is null or length(requester_phone) <= 40),
  requester_relation text not null check (length(btrim(requester_relation)) between 1 and 200),
  person_name text not null check (length(btrim(person_name)) between 1 and 200),
  -- Free text on purpose: 'around 1985' is a fine answer
  birth_date text check (birth_date is null or length(birth_date) <= 60),
  death_date text check (death_date is null or length(death_date) <= 60),
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  home text check (home is null or length(home) <= 200),
  story text check (story is null or length(story) <= 20000),
  photo_path text,
  is_minor boolean not null default false,
  family_informed boolean not null default false,
  status public.request_status not null default 'new',
  staff_note text check (staff_note is null or length(staff_note) <= 4000),
  person_id uuid references public.people (id) on delete set null,
  locale text check (locale is null or locale in ('en', 'de', 'es')),
  created_at timestamptz not null default now()
);

create index memorial_requests_status_idx on public.memorial_requests (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Rate limiting for public submissions
-- Keys are salted hashes computed by the app server; no IP addresses are stored.
-- ---------------------------------------------------------------------------

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

create function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  -- Old buckets are useless after a day; keep the table small.
  delete from public.rate_limits where window_start < now() - interval '1 day';

  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers: publishing rules
-- ---------------------------------------------------------------------------

create function public.people_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_trusted boolean := public.is_trusted_backend();
begin
  -- Lighting a candle bumps candle_count; that is not an edit of the memorial.
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1
     and new.candle_count is distinct from old.candle_count then
    return new;
  end if;

  new.updated_at := now();

  -- Only an admin may confirm (or withdraw the confirmation of) a minor's memorial.
  if tg_op = 'INSERT' and new.minor_confirmed_at is not null
     or tg_op = 'UPDATE' and new.minor_confirmed_at is distinct from old.minor_confirmed_at then
    if not (public.is_admin() or v_is_trusted) then
      raise exception 'Only an admin can confirm the memorial of a minor'
        using errcode = '42501', hint = 'minor_confirmation_admin_only';
    end if;
    if new.minor_confirmed_at is not null and auth.uid() is not null then
      new.minor_confirmed_by := auth.uid();
    elsif new.minor_confirmed_at is null then
      new.minor_confirmed_by := null;
    end if;
  end if;

  -- The candle counter is maintained by the candles trigger only.
  if tg_op = 'UPDATE' and new.candle_count <> old.candle_count and not v_is_trusted then
    new.candle_count := old.candle_count;
  end if;

  if new.status = 'published' then
    if not new.consent_confirmed then
      raise exception 'A memorial can only be published after the family and NPH have agreed'
        using errcode = '23514', hint = 'consent_required';
    end if;
    if new.minor and new.minor_confirmed_at is null then
      raise exception 'The memorial of a minor needs an admin''s confirmation before it is published'
        using errcode = '23514', hint = 'minor_confirmation_required';
    end if;
    if tg_op = 'INSERT' or old.status is distinct from 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
  end if;

  return new;
end;
$$;

create trigger people_before_write
  before insert or update on public.people
  for each row execute function public.people_before_write();

-- ---------------------------------------------------------------------------
-- Triggers: candles
-- ---------------------------------------------------------------------------

create function public.candles_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  new.author_name := nullif(btrim(new.author_name), '');
  new.message := nullif(btrim(new.message), '');

  if not (public.is_staff() or public.is_trusted_backend()) then
    new.hidden := false;
    new.created_at := now();
    -- Words are read by a person before they appear; a quiet candle counts right away.
    if new.author_name is null and new.message is null then
      new.message_status := 'approved';
    else
      new.message_status := 'pending';
    end if;

    select count(*) into v_recent
    from public.candles
    where person_id = new.person_id and created_at > now() - interval '10 minutes';
    if v_recent >= 60 then
      raise exception 'Too many candles in a short time' using errcode = 'P0001', hint = 'rate_limited';
    end if;
  end if;

  return new;
end;
$$;

create trigger candles_before_insert
  before insert on public.candles
  for each row execute function public.candles_before_insert();

create function public.candles_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and not new.hidden then
    update public.people set candle_count = candle_count + 1 where id = new.person_id;
  elsif tg_op = 'DELETE' and not old.hidden then
    update public.people set candle_count = greatest(candle_count - 1, 0) where id = old.person_id;
  elsif tg_op = 'UPDATE' and new.hidden <> old.hidden then
    update public.people
      set candle_count = greatest(candle_count + case when new.hidden then -1 else 1 end, 0)
      where id = new.person_id;
  end if;
  return null;
end;
$$;

create trigger candles_after_change
  after insert or update of hidden or delete on public.candles
  for each row execute function public.candles_after_change();

-- ---------------------------------------------------------------------------
-- Triggers: tributes and requests (normalise, guard against floods)
-- ---------------------------------------------------------------------------

create function public.tributes_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  new.author_name := btrim(new.author_name);
  new.author_relation := nullif(btrim(new.author_relation), '');
  new.message := btrim(new.message);

  if not (public.is_staff() or public.is_trusted_backend()) then
    new.status := 'pending';
    new.hidden := false;
    new.moderated_by := null;
    new.moderated_at := null;
    new.created_at := now();

    select count(*) into v_recent
    from public.tributes
    where person_id = new.person_id and status = 'pending' and created_at > now() - interval '1 hour';
    if v_recent >= 20 then
      raise exception 'Too many tributes waiting for this memorial' using errcode = 'P0001', hint = 'rate_limited';
    end if;
  end if;

  return new;
end;
$$;

create trigger tributes_before_insert
  before insert on public.tributes
  for each row execute function public.tributes_before_insert();

create function public.memorial_requests_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  if not (public.is_staff() or public.is_trusted_backend()) then
    new.status := 'new';
    new.staff_note := null;
    new.person_id := null;
    new.created_at := now();

    select count(*) into v_recent
    from public.memorial_requests
    where created_at > now() - interval '1 hour';
    if v_recent >= 30 then
      raise exception 'Too many requests in a short time' using errcode = 'P0001', hint = 'rate_limited';
    end if;
  end if;

  return new;
end;
$$;

create trigger memorial_requests_before_insert
  before insert on public.memorial_requests
  for each row execute function public.memorial_requests_before_insert();

-- Record who moderated a tribute and when.
create function public.tributes_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.moderated_by := auth.uid();
    new.moderated_at := now();
  end if;
  return new;
end;
$$;

create trigger tributes_before_update
  before update on public.tributes
  for each row execute function public.tributes_before_update();

-- ---------------------------------------------------------------------------
-- Privileges
-- Supabase grants everything in `public` to anon and authenticated by default.
-- We narrow that down, so even a mistaken policy cannot leak internal columns.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon, authenticated, public;

-- Helpers used inside policies
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.current_staff_role() to authenticated;

-- Only the app server (service role) may count submissions
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
revoke all on public.rate_limits from anon, authenticated;

-- What the public may read
grant select (
  id, slug, name, known_as, birth_date, birth_date_precision, death_date, death_date_precision,
  country, home, story, story_lang, portrait_url, status, sample, candle_count, published_at, created_at
) on public.people to anon;
grant select (id, person_id, title, description, sort_order, created_at) on public.albums to anon;
grant select (
  id, person_id, album_id, storage_path, thumb_path, width, height, caption, contributed_by, status, hidden, sort_order, created_at
) on public.photos to anon;
grant select (id, person_id, author_name, author_relation, message, photo_url, status, hidden, created_at)
  on public.tributes to anon;
grant select (id, person_id, author_name, message, message_status, hidden, created_at)
  on public.candles to anon;

-- What the public may write
grant insert (person_id, author_name, author_relation, message, photo_url, locale) on public.tributes to anon;
grant insert (person_id, author_name, message) on public.candles to anon;
grant insert (
  requester_name, requester_email, requester_phone, requester_relation, person_name, birth_date, death_date,
  country, home, story, photo_path, is_minor, family_informed, locale
) on public.memorial_requests to anon;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.people enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.tributes enable row level security;
alter table public.candles enable row level security;
alter table public.memorial_requests enable row level security;
alter table public.rate_limits enable row level security;

-- admin_users
create policy "Staff see the staff list" on public.admin_users
  for select to authenticated using (public.is_staff());
create policy "Admins add staff" on public.admin_users
  for insert to authenticated with check (public.is_admin());
create policy "Admins change staff roles" on public.admin_users
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins remove staff" on public.admin_users
  for delete to authenticated using (public.is_admin());

-- people
create policy "Anyone reads published memorials" on public.people
  for select to anon, authenticated using (status = 'published');
create policy "Staff read all memorials" on public.people
  for select to authenticated using (public.is_staff());
create policy "Staff create memorials" on public.people
  for insert to authenticated with check (public.is_staff());
create policy "Staff edit memorials" on public.people
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Admins delete memorials" on public.people
  for delete to authenticated using (public.is_admin());

-- albums
create policy "Anyone reads albums of published memorials" on public.albums
  for select to anon, authenticated
  using (exists (select 1 from public.people p where p.id = person_id and p.status = 'published'));
create policy "Staff manage albums" on public.albums
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- photos
create policy "Anyone reads approved photos of published memorials" on public.photos
  for select to anon, authenticated
  using (
    status = 'approved' and not hidden
    and exists (select 1 from public.people p where p.id = person_id and p.status = 'published')
  );
create policy "Staff manage photos" on public.photos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- tributes
create policy "Anyone reads approved tributes of published memorials" on public.tributes
  for select to anon, authenticated
  using (
    status = 'approved' and not hidden
    and exists (select 1 from public.people p where p.id = person_id and p.status = 'published')
  );
create policy "Anyone leaves a tribute on a published memorial" on public.tributes
  for insert to anon, authenticated
  with check (
    status = 'pending' and not hidden
    and exists (select 1 from public.people p where p.id = person_id and p.status = 'published')
  );
create policy "Staff read all tributes" on public.tributes
  for select to authenticated using (public.is_staff());
create policy "Staff moderate tributes" on public.tributes
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff delete tributes" on public.tributes
  for delete to authenticated using (public.is_staff());

-- candles
create policy "Anyone reads approved candle messages of published memorials" on public.candles
  for select to anon, authenticated
  using (
    message_status = 'approved' and not hidden
    and exists (select 1 from public.people p where p.id = person_id and p.status = 'published')
  );
create policy "Anyone lights a candle on a published memorial" on public.candles
  for insert to anon, authenticated
  with check (
    not hidden
    and exists (select 1 from public.people p where p.id = person_id and p.status = 'published')
  );
create policy "Staff read all candles" on public.candles
  for select to authenticated using (public.is_staff());
create policy "Staff moderate candles" on public.candles
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff delete candles" on public.candles
  for delete to authenticated using (public.is_staff());

-- memorial requests
create policy "Anyone asks for a memorial" on public.memorial_requests
  for insert to anon, authenticated
  with check (status = 'new' and person_id is null and staff_note is null);
create policy "Staff read requests" on public.memorial_requests
  for select to authenticated using (public.is_staff());
create policy "Staff handle requests" on public.memorial_requests
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Admins delete requests" on public.memorial_requests
  for delete to authenticated using (public.is_admin());

-- rate_limits: no policies; only reachable through hit_rate_limit()

-- ---------------------------------------------------------------------------
-- Storage
--   media   : public, approved images only (portraits, album photos, tribute photos)
--   uploads : private, images sent by the public, waiting for moderation
-- The public never writes to storage directly; the app server does that.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('uploads', 'uploads', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Staff manage memorial images" on storage.objects
  for all to authenticated
  using (bucket_id in ('media', 'uploads') and public.is_staff())
  with check (bucket_id in ('media', 'uploads') and public.is_staff());
