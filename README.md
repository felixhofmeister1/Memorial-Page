# Remembered – memorial pages of the Padre Wasson Foundation

One page for each former child or young person of Nuestros Pequeños Hermanos (NPH) who has
died: portrait, dates, the home they grew up in, their story, photos, words from family and
friends, a candle, and a link to give in their memory. Families and NPH staff can ask for a
page; nothing is published before the family and NPH have agreed.

The pages are meant to sit inside padrewassonfoundation.org (menu MEET → Remembered) and
look like the rest of that site. The current look is an **interim design**: see
[DESIGN.md](DESIGN.md) for why and for the steps to match the real site.

- Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · next-intl (English, German, Spanish)
- Supabase: Postgres with Row Level Security, Auth (staff only), Storage
- Deploys to Vercel. No analytics, no tracking, no cookies for visitors.

## Running it without a database

The app works before there is a database. What it does depends on where it runs
(see [`src/lib/mode.ts`](src/lib/mode.ts)):

| | Where | Memorials come from | Forms | Admin |
|---|---|---|---|---|
| **Local mode** | your own computer (`npm run dev`) | `data/memorials.json` | save | `/admin`, no sign-in |
| **Preview mode** | deployed, no Supabase settings | `src/content/memorials.ts` | save nothing | none |
| **Database** | `SUPABASE_URL` and `SUPABASE_ANON_KEY` set | Supabase | save | `/admin`, with sign-in |

### Local mode: the full app on your computer

```bash
npm install
npm run dev
```

Open <http://localhost:3000/remembered>. The **Admin** link in the footer leads to `/admin`,
where you can add and edit memorials, upload a portrait and photos, put photos into albums,
read and approve tributes and candle messages, and turn requests into memorial pages.
The forms on the public pages work too, so you can try them as a visitor would.

- Everything is saved in the `data/` folder: `data/memorials.json` for the text, `data/media/`
  for approved images, `data/uploads/` for photos waiting to be read. Back up that folder to keep
  your work. It is in `.gitignore`: it holds personal data and is never committed.
- On the first start, `data/memorials.json` is filled from `src/content/memorials.ts`
  (one test page). Delete the `data/` folder to start again from there.
- The same rules apply as with the database: a page is only published once consent is
  confirmed, the page of someone who died before 18 needs the extra admin confirmation,
  and tributes, photos and candle messages appear only after approval.
- There is no sign-in. The admin only opens on this computer (at `localhost`); from any
  other address it does not exist. Local mode is never used on a deployed site.
- To run the built app locally instead of `npm run dev`:
  `MEMORIAL_LOCAL=true npm run build && MEMORIAL_LOCAL=true npm start`.
- `MEMORIAL_DATA_DIR=/some/folder` keeps the data somewhere other than `data/`.

### Preview mode: deployed without a database

Deployed (for example to Vercel) without the Supabase settings, the site shows the pages in
[`src/content/memorials.ts`](src/content/memorials.ts) and nothing else. The forms check what
people type, then say that nothing was saved. There is no admin area. Edit that file to change
what the preview shows; the comments at the top explain the fields.

### Moving to the database later

1. Set up Supabase and fill in `.env.local` (see "Deploying" below).
2. Copy what you made in local mode into the database, images included:

   ```bash
   npm run import-local
   ```

   Running it twice does no harm: rows that are already there are skipped.
3. Create your staff account (see "Deploying"). From then on the app uses the database,
   and `/admin` asks you to sign in.

## Pages

| Address                         | What it is |
| ------------------------------- | ---------- |
| `/remembered`                   | Everyone we remember. Search by name (accents optional), filter by country, NPH home, year of passing. |
| `/remembered/<slug>`            | One memorial: portrait, dates, place, story, photo albums, tributes, candle with counter, give in their memory. |
| `/remembered/request`           | Request a memorial page (families, NPH staff). Goes to the staff queue. |
| `/about-this-memorial`, `/privacy`, `/impressum` | Text pages. **Drafts** for the foundation to replace. |
| `/admin`                        | Staff area (sign-in required). |

German lives under `/de/…`, Spanish under `/es/…`; English has no prefix. The language comes from
the address only, so a link shared on WhatsApp opens in the language it was shared in.

## Rules the database enforces

These hold no matter which client talks to the database (see
[`supabase/migrations`](supabase/migrations) and [`scripts/check-rls.sql`](scripts/check-rls.sql)):

- A memorial can only be `published` when `consent_confirmed` is true (family and NPH agreed).
  Consent cannot be withdrawn while the page is public; unpublish first.
- If the person died before turning 18 (`minor`), publishing also needs `minor_confirmed_at`,
  which **only an admin** can set. Who confirmed and when is recorded.
- Tributes and photos appear only after a staff member approves them. A candle counts at once;
  a name or words on a candle appear only after approval.
- The public can read published and approved content, and can insert tributes, candles and
  memorial requests. Nothing else. Internal columns (consent notes, who confirmed) are not
  readable by the public at all (column privileges, not just row policies).
- Floods are stopped in the database too (per memorial and per hour), in addition to the
  app's per-visitor rate limits.

Roles: **admin** (everything, including confirming minors, deleting memorials, managing staff)
and **editor** (moderate, edit and publish memorials).

## Privacy and spam protection

- Visitors get no cookies. Staff get a session cookie after signing in.
- No IP addresses are stored. For rate limits the server keeps a salted, one-way hash of
  the address for at most one day.
- Uploaded photos are re-encoded on the server (sharp): GPS position and camera data are
  removed, size is limited to 2000 px. In the browser, large photos are made smaller first so
  uploads work on slow connections.
- Photos sent by the public go to a private bucket and are only moved to the public one
  when approved. Public images are served from this site's own address (`/media/…`), so
  visitors' browsers only talk to one host.
- Spam: hidden honeypot field, a signed form timestamp (forms sent within 3 seconds are
  refused, candles excepted), per-visitor rate limits, database flood guards.
  Cloudflare Turnstile can be switched on (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  `TURNSTILE_SECRET_KEY`) but loads a third-party script, so it is off by default.
- Pages carry `noindex` and `robots.txt` disallows everything until `ALLOW_INDEXING=true`.

## Local development with the database

You need Node.js 20.9+ and Docker (for the Supabase CLI).

```bash
npm install
npx supabase start          # local Postgres, Auth, Storage (Docker)
npx supabase db reset       # applies the migration and supabase/seed.sql
cp .env.example .env.local  # fill in the values printed by `supabase start`
npm run dev                 # http://localhost:3000
```

`.env.local` for the local stack:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start>
SUBMISSION_SECRET=<any long random string>
```

Create a first admin: open Supabase Studio (http://127.0.0.1:54323) → Authentication → Add user
(with password, auto-confirm), then in the SQL editor:

```sql
insert into public.admin_users (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.org';
```

Checks:

```bash
npm run typecheck
npm run lint
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f scripts/check-rls.sql
```

The RLS script runs 42 checks as the public, a signed-in non-staff user, an editor, an admin
and the server, inside a transaction that is rolled back.

## Deploying

### 1. Supabase (database, auth, storage)

1. Create a project, preferably in an EU region (Frankfurt), and sign the Data Processing
   Agreement in the organisation settings.
2. Apply the schema: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
   **Do not load `seed.sql` in production** (it contains invented sample people).
3. Authentication → Sign In / Providers: turn off "Allow new users to sign up".
   Email provider on, minimum password length 10.
4. Authentication → URL Configuration: Site URL = the public address of this app
   (for example `https://remembered.padrewassonfoundation.org`); add `<site>/**` to redirect URLs.
5. Authentication → Emails → Templates: paste [`supabase/templates/invite.html`](supabase/templates/invite.html)
   into "Invite user" and [`supabase/templates/recovery.html`](supabase/templates/recovery.html)
   into "Reset password". They link to `/auth/confirm`, which signs the staff member in on the server.
6. Authentication → Emails → SMTP: set up the foundation's own mail server (Supabase's built-in
   sender is limited to a few emails per hour).
7. Create the first admin as in "Local development" (Studio → Add user, then the SQL insert).
   Further staff are invited from `/admin/staff`.

Storage buckets (`media` public, `uploads` private) are created by the migration.

### 2. Vercel (the app)

1. Import the repository in Vercel. Framework preset: Next.js. Region is set to Frankfurt in
   [`vercel.json`](vercel.json).
2. Environment variables (Production and Preview): `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUBMISSION_SECRET`
   (`openssl rand -base64 32`), and `DONATE_URL` once the real Donate address is confirmed.
3. Deploy. Vercel Web Analytics and Speed Insights should stay **off**.

### 3. Domain

Two options; the foundation decides:

- **Subdomain** (simplest): `remembered.padrewassonfoundation.org` as a CNAME to Vercel.
  The menu link "Remembered" on the WordPress site points there.
- **Same domain, path** (`padrewassonfoundation.org/remembered`): needs a reverse proxy rule on
  the WordPress host that forwards `/remembered`, `/de/remembered`, `/es/remembered`, `/admin`,
  `/auth`, `/media` and `/_next` to Vercel.

The pages allow being framed by `padrewassonfoundation.org` (CSP `frame-ancestors`), in case the
foundation prefers to embed them.

## Everyday work for staff

- **Tributes** and **Candles**: read what came in, approve or reject. Approved items can be
  hidden again later.
- **Requests**: read, write an internal note, set a status, and "Start a memorial page" to create
  a draft from the request (name, country, home, story and photo are copied; the requester's
  details go into the internal consent note).
- **Memorials**: write the story with the family, set dates (with "year only" when the exact
  date is not known), portrait, albums and photos. Record who agreed, tick consent, set the status
  to Published. For a minor, an admin ticks the extra confirmation first.
- **Preview** shows the page as visitors will see it, also before it is published.

## Removing the test and sample data

Pages marked `sample` show "This is a test page, not a real memorial." The app starts with one
such test page (in `src/content/memorials.ts`); the database seed contains three invented
people and one sample request, used by `scripts/check-rls.sql`. Before going live:

```sql
delete from public.people where sample;
delete from public.memorial_requests where requester_email like '%@example.org';
```

## Project layout

```
messages/                 interface text: en.json, de.json, es.json
src/app/[locale]/         pages (public and admin)
src/app/auth/confirm/     target of staff email links
src/components/           site (header, footer), memorial, forms, admin
src/lib/actions/          server actions (public submissions, admin)
src/lib/data/             reads (database, local files or the content file)
src/lib/local/            local mode: file store with the same rules as the database
src/lib/mode.ts           which mode the app is in
src/content/memorials.ts  the pages the app starts with (one test page)
data/                     local mode's saved memorials and images (not committed)
src/lib/site.ts           the foundation's main menu and links
src/app/globals.css       design tokens (see DESIGN.md)
supabase/migrations/      schema, rules, Row Level Security, storage
supabase/seed.sql         invented sample content
scripts/check-rls.sql     access rule checks
scripts/import-local-data.mjs   copies local mode's data into Supabase
```
