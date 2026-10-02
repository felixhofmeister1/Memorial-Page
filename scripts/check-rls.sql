-- Checks the access rules against a database that has the migration and seed applied.
-- Everything runs in one transaction and is rolled back at the end.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/check-rls.sql
--
-- Each check prints "ok - ..." or stops with "FAILED - ...".

begin;

create function pg_temp.ok(passed boolean, label text) returns void language plpgsql as $$
begin
  if passed is not true then
    raise exception 'FAILED - %', label;
  end if;
  raise notice 'ok - %', label;
end $$;

-- Runs a statement that must fail. Returns the error's hint (or message if no hint).
create function pg_temp.fails(stmt text) returns text language plpgsql as $$
declare
  v_hint text;
  v_msg text;
begin
  begin
    execute stmt;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint, v_msg = message_text;
    return coalesce(nullif(v_hint, ''), v_msg);
  end;
  return null;
end $$;

grant execute on function pg_temp.ok(boolean, text), pg_temp.fails(text) to anon, authenticated, service_role;

-- Test staff and a signed-in user who is not staff
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000e1', 'editor@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b1', 'nobody@test.local', 'authenticated', 'authenticated');
insert into public.admin_users (user_id, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'admin'),
  ('00000000-0000-4000-8000-0000000000e1', 'editor');

-- A draft memorial of a minor, not yet agreed by the family
insert into public.people (id, slug, name, status, minor, consent_confirmed)
values ('00000000-0000-4000-8000-00000000d001', 'draft-test', 'Draft Test', 'draft', true, false);

-- ---------------------------------------------------------------------------
-- The public (anon)
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select pg_temp.ok((select count(*) from public.people) = 3, 'anon sees only the published memorials');
select pg_temp.ok(not exists (select 1 from public.people where slug = 'draft-test'), 'anon does not see drafts');
select pg_temp.ok(pg_temp.fails('select consent_note from public.people') like '%permission denied%',
  'anon cannot read internal consent notes');
select pg_temp.ok(pg_temp.fails('select minor_confirmed_by from public.people') like '%permission denied%',
  'anon cannot read who confirmed a minor');
select pg_temp.ok((select count(*) from public.tributes where status <> 'approved') = 0,
  'anon sees no pending tributes');
select pg_temp.ok((select count(*) from public.candles where message_status <> 'approved') = 0,
  'anon sees no pending candle messages');

select pg_temp.ok(pg_temp.fails($$insert into public.tributes (person_id, author_name, message)
  values ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'Test', 'A message')$$) is null,
  'anon can leave a tribute on a published memorial');
select pg_temp.ok(pg_temp.fails($$insert into public.tributes (person_id, author_name, message, status)
  values ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'Test', 'Approve me', 'approved')$$) like '%permission denied%',
  'anon cannot set a tribute''s status');
select pg_temp.ok(pg_temp.fails($$insert into public.tributes (person_id, author_name, message)
  values ('00000000-0000-4000-8000-00000000d001', 'Test', 'On a draft')$$) like '%row-level security%',
  'anon cannot leave a tribute on a draft');
select pg_temp.ok(pg_temp.fails($$update public.tributes set status = 'approved'$$) like '%permission denied%',
  'anon cannot approve tributes');

select pg_temp.ok(pg_temp.fails($$insert into public.candles (person_id)
  values ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02')$$) is null, 'anon can light a quiet candle');
select pg_temp.ok(pg_temp.fails($$insert into public.candles (person_id, author_name, message)
  values ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', 'Test', 'With words')$$) is null,
  'anon can light a candle with words');
select pg_temp.ok((select candle_count from public.people where slug = 'jose-antonio-mejia') = 17,
  'both candles are counted at once');
select pg_temp.ok(not exists (select 1 from public.candles where message = 'With words'),
  'candle words stay hidden until read');

select pg_temp.ok(pg_temp.fails($$update public.people set candle_count = 1000$$) like '%permission denied%',
  'anon cannot change memorials');
select pg_temp.ok(pg_temp.fails($$delete from public.people$$) like '%permission denied%',
  'anon cannot delete memorials');

select pg_temp.ok(pg_temp.fails($$insert into public.memorial_requests
  (requester_name, requester_email, requester_relation, person_name)
  values ('Test', 'test@example.org', 'sister', 'Someone')$$) is null, 'anon can ask for a memorial');
select pg_temp.ok(pg_temp.fails($$insert into public.memorial_requests
  (requester_name, requester_email, requester_relation, person_name, status)
  values ('Test', 'test@example.org', 'sister', 'Someone', 'accepted')$$) like '%permission denied%',
  'anon cannot set a request''s status');
select pg_temp.ok(pg_temp.fails('select * from public.memorial_requests') like '%permission denied%',
  'anon cannot read memorial requests');
select pg_temp.ok(pg_temp.fails('select * from public.admin_users') like '%permission denied%',
  'anon cannot read the staff list');
select pg_temp.ok(pg_temp.fails($$select public.hit_rate_limit('x', 1, 60)$$) like '%permission denied%',
  'anon cannot touch the rate limiter');
select pg_temp.ok(pg_temp.fails('select * from public.rate_limits') like '%permission denied%',
  'anon cannot read rate limits');

reset role;

-- ---------------------------------------------------------------------------
-- Signed in, but not staff
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}';

select pg_temp.ok((select count(*) from public.people) = 3, 'a non-staff account sees only published memorials');
select pg_temp.ok((select count(*) from public.memorial_requests) = 0, 'a non-staff account sees no requests');
update public.people set name = 'Changed' where slug = 'lupita-ramirez-solis';
select pg_temp.ok(not exists (select 1 from public.people where name = 'Changed'), 'a non-staff account cannot edit');
select pg_temp.ok(pg_temp.fails($$insert into public.admin_users (user_id, role)
  values ('00000000-0000-4000-8000-0000000000b1', 'admin')$$) like '%row-level security%',
  'a non-staff account cannot make itself admin');

reset role;

-- ---------------------------------------------------------------------------
-- Editor
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"authenticated"}';

select pg_temp.ok(exists (select 1 from public.people where slug = 'draft-test'), 'an editor sees drafts');
select pg_temp.ok((select count(*) from public.memorial_requests) >= 1, 'an editor sees requests');
select pg_temp.ok(exists (select 1 from public.tributes where status = 'pending'), 'an editor sees pending tributes');

select pg_temp.ok(pg_temp.fails($$update public.people set status = 'published' where slug = 'draft-test'$$) = 'consent_required',
  'nobody can publish without consent');
update public.people set consent_confirmed = true where slug = 'draft-test';
select pg_temp.ok(pg_temp.fails($$update public.people set status = 'published' where slug = 'draft-test'$$) = 'minor_confirmation_required',
  'a minor''s memorial cannot be published without an admin''s confirmation');
select pg_temp.ok(pg_temp.fails($$update public.people set minor_confirmed_at = now() where slug = 'draft-test'$$) = 'minor_confirmation_admin_only',
  'an editor cannot confirm a minor''s memorial');

update public.people set candle_count = 999 where slug = 'lupita-ramirez-solis';
select pg_temp.ok((select candle_count from public.people where slug = 'lupita-ramirez-solis') = 25,
  'staff cannot fake the candle count');

update public.tributes set status = 'approved' where author_name = 'Marvin';
select pg_temp.ok((select moderated_by from public.tributes where author_name = 'Marvin') = '00000000-0000-4000-8000-0000000000e1',
  'moderation records who approved');

delete from public.people where slug = 'draft-test';
select pg_temp.ok(exists (select 1 from public.people where slug = 'draft-test'), 'an editor cannot delete memorials');
select pg_temp.ok(pg_temp.fails($$update public.admin_users set role = 'admin'
  where user_id = '00000000-0000-4000-8000-0000000000e1'$$) is null
  and (select role from public.admin_users where user_id = '00000000-0000-4000-8000-0000000000e1') = 'editor',
  'an editor cannot promote themselves');

reset role;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}';

update public.people set minor_confirmed_at = now() where slug = 'draft-test';
select pg_temp.ok((select minor_confirmed_by from public.people where slug = 'draft-test') = '00000000-0000-4000-8000-0000000000a1',
  'an admin can confirm a minor''s memorial, and it is recorded who did');
select pg_temp.ok(pg_temp.fails($$update public.people set status = 'published' where slug = 'draft-test'$$) is null,
  'with consent and confirmation the memorial can be published');
select pg_temp.ok((select published_at from public.people where slug = 'draft-test') is not null, 'published_at is set');
select pg_temp.ok(pg_temp.fails($$update public.people set consent_confirmed = false where slug = 'draft-test'$$) = 'consent_required',
  'consent cannot be withdrawn while the page is public');

delete from public.people where slug = 'draft-test';
select pg_temp.ok(not exists (select 1 from public.people where slug = 'draft-test'), 'an admin can delete a memorial');

reset role;

-- ---------------------------------------------------------------------------
-- App server (service role)
-- ---------------------------------------------------------------------------
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';

select pg_temp.ok(public.hit_rate_limit('test-key', 2, 600) and public.hit_rate_limit('test-key', 2, 600)
  and not public.hit_rate_limit('test-key', 2, 600), 'the rate limiter stops the third attempt');

reset role;

rollback;
