# DESIGN.md

The memorial pages must look like part of padrewassonfoundation.org, built by the same
people. Every visual value in this app comes from this file, and every value in this
file must come from the live site's HTML and CSS. Nothing here may be invented.

## Status: not yet extracted

**The live site has not been studied yet.** During the build (2 October 2026) the cloud
environment's network policy blocked `padrewassonfoundation.org` and every mirror of it
(Wayback Machine, Google cache, archive.ph, the site's `test.` and `pregolive.` subdomains).
The logo files could not be downloaded and no CSS could be read.

What that means for the code today:

- All colours, fonts, sizes and spacing live as tokens in [`src/app/globals.css`](src/app/globals.css)
  (`@theme { … }`). They are **neutral stand-ins**: browser default sans-serif, black on
  white, grey rules, no accent colour. They are not a design and must be replaced.
- The header shows the foundation's name as text where the logo belongs.
- The footer is a minimal stand-in, not the site's real footer.
- Layout (photo beside text, reading width, section spacing) is a plain first guess and
  must be checked against the real pages.

To finish: allow `padrewassonfoundation.org` in the environment's network settings
(or run the steps below on any machine with internet), then work through the checklist.

## What is known (from the search index)

These facts come from search results for the live site, not from guesses.

### Platform

WordPress. Evidence: `/category/uncategorized` exists, and a page slug with WordPress'
duplicate suffix (`/padre-wasson-2`). The page title pattern in search results is the
page name alone; WordPress' default `Page – Site name` is used in the app until checked.

### Main menu

Four sections, labels in capitals, in this order. URLs marked ✓ appear in search
results; the others could not be confirmed and point to the home page in
[`src/lib/site.ts`](src/lib/site.ts) (`verified: false`).

| Section  | Item              | URL                    |
| -------- | ----------------- | ---------------------- |
| LOVE     | Purpose (why)     | `/padre-wasson` ✓      |
|          | Sauce (how)       | `/philosophy` ✓        |
|          | Foundation (what) | `/legacy` ✓            |
|          | History           | ?                      |
| MEET     | Padre Wasson      | `/padre-wasson-2` ✓    |
|          | Founders          | `/founders` ✓          |
|          | Family            | ?                      |
|          | Alumni            | ?                      |
|          | **Remembered**    | this app (new)         |
|          | Team              | `/team` ✓              |
|          | You               | ?                      |
| DISCOVER | Facts             | ?                      |
|          | Actions           | `/about-us` ✓ (sub-items: Emergency aid, Education, Family support) |
|          | Visions           | ?                      |
|          | Blog              | ? (`/category/uncategorized` exists) |
|          | Reports           | ?                      |
|          | Partners          | `/partners` ✓          |
| SHARE    | Participate       | ?                      |
|          | Donate            | ? (donation details appear on the home page) |
|          | Shop              | `/shop` ✓              |
|          | Share big         | ?                      |
|          | Share forever     | ?                      |

Other confirmed pages: `/impressum`, `/better-than-prayer`, `/frank`, `/albert`.
"Remembered" is placed under MEET, between Alumni and Team: the people we remember
are alumni, and the section sits next to the people pages, not the money pages.

The "give in their memory" link uses `DONATE_URL` (default `https://padrewassonfoundation.org/donate`,
**unverified**). Set it to the real Donate page or anchor.

### Voice

Observed in post titles and texts (sources: `/frank`, `/albert`, `/better-than-prayer`, home):

- Letters to family: German posts open with **"Liebe Familie, liebe Freunde"**.
- Titles speak to the person: **"Frank, you were wonderful. Honoring 101 compassionate years"**.
- Thank-you posts name concrete numbers and people:
  **"Danke für 1830 Euro Spenden für Medizin zu Albert Millers Neunzigstem!"**
- Exact, human detail: Frank "passed away peacefully in his home at the age of 101 at 8:30 AM March 20, in the presence of family members."
- Family words, not institution words: "Padre Wasson's family", "the grown-ups of Padre Wasson's
  family and their children, the alumni", "a family more than it is an institution, where members
  are connected to each other, share good and bad times, and feel responsible for one another".
- Faith shown through action: "more important than prayer was action"; support as
  "medication against despair".
- Both English and German posts; the menu is in English.

How the app follows this: "we" is the family, not "the organisation"; the request page
opens "Dear family, dear friends," / "Liebe Familie, liebe Freunde," / "Querida familia,
queridos amigos:"; sample stories end by speaking to the person ("Toño, the tables you
made are still standing."); no slogans, no "legacy", no "celebrate life".

Open question for the foundation: German interface text uses **du** (family tone). Switch to
*Sie* if the foundation addresses readers formally. Spanish uses *tú*.

## Extraction checklist

Open each page at **390 px** (phone) and **1280 px** (desktop): home, Family, Alumni,
`/frank`, Donate, Share forever, `/team`. Read values from the computed styles and the
theme's stylesheet (`wp-content/themes/<theme>/style.css` and any customizer CSS in `<style>`
in the page head). Record the value, where it was measured, and the token it fills.

### Brand files → `public/brand/`

| File                  | Source on the site | Used in |
| --------------------- | ------------------ | ------- |
| Full logo (SVG/PNG)   | header `<img>`     | `src/components/site/SiteHeader.tsx` (replace the text stand-in, keep the link to the main site) |
| White heart           | footer or favicon  | footer, `src/app/icon.png` / favicon |
| Favicon / site icon   | `<link rel="icon">` | `src/app/icon.*` |

### Colours → `@theme` in `src/app/globals.css`

| Token                 | Meaning                         | Value | Measured on |
| --------------------- | ------------------------------- | ----- | ----------- |
| `--color-paper`       | page background                 | TBD   |             |
| `--color-ink`         | body text                       | TBD   |             |
| `--color-muted`       | dates, captions, secondary text | TBD   |             |
| `--color-line`        | rules, borders                  | TBD   |             |
| `--color-link`        | links (+ note hover)            | TBD   |             |
| `--color-accent`      | button background               | TBD   |             |
| `--color-on-accent`   | button text                     | TBD   |             |
| `--color-header`      | header background               | TBD   |             |
| `--color-footer`      | footer background               | TBD   |             |
| `--color-footer-ink`  | footer text                     | TBD   |             |
| `--color-error`       | form errors (if the site has one; otherwise keep a dark red that passes 4.5:1) | TBD | |

Keep `--color-placeholder` plain grey (requested for sample photos).
Check every text/background pair for WCAG AA (4.5:1 body, 3:1 large text).

### Type

| Token / item          | Value | Notes |
| --------------------- | ----- | ----- |
| `--font-body`         | TBD   | family and source (Google Fonts / self-hosted / Typekit); load it the same way, self-hosted via `next/font` if licence allows |
| `--font-heading`      | TBD   | |
| `--text-body`         | TBD   | desktop and phone |
| `--text-h1`, `--text-h2`, `--text-h3` | TBD | page title, section title, small heading |
| `--text-small`        | TBD   | captions, meta |
| `--leading-body`, `--leading-heading` | TBD | |
| Menu                  | TBD   | size, weight, letter-spacing, uppercase via CSS or in text |
| Heading weight / case | TBD   | |

### Layout and components

| Item                     | Value | Where it applies |
| ------------------------ | ----- | ---------------- |
| `--container-site`       | TBD   | page width |
| `--container-text`       | TBD   | reading width of posts |
| `--spacing-gutter`       | TBD   | side padding on phones |
| Section spacing          | TBD   | vertical rhythm between blocks |
| Header                   | TBD   | height, logo size, menu position, sticky or not, phone menu (hamburger? label?) |
| Dropdowns                | TBD   | hover or click, background, border/shadow |
| Footer                   | TBD   | columns and content; rebuild `SiteFooter.tsx` to match, keep the three memorial links |
| Buttons (`.button`)      | TBD   | radius (`--radius-button`), padding, case, hover |
| Links                    | TBD   | underline or not, hover |
| Form fields (`.field`)   | TBD   | border, radius, padding (look at any site form or the WordPress comment form) |
| Photos beside text       | TBD   | image width share, alignment, gap, caption style; apply to the memorial header and the overview list |
| Image treatment          | TBD   | borders, shadows (hopefully none), aspect ratios, full-bleed or contained |
| Blog post layout         | TBD   | title placement, date style, featured image; the memorial page should read like one of these posts |

### Side-by-side check

After applying the values, compare at 390 px and 1280 px:
`/remembered` with the Alumni page, `/remembered/lupita-ramirez-solis` with `/frank`,
`/remembered/request` with a page that has a form. If someone who knows
padrewassonfoundation.org would think it came from a different website, adjust.

## Rules that stay, whatever the extraction shows

- No gradients, glass effects, glows, shadows for decoration, dark "SaaS" themes.
- No card grids with icons; lists and photos beside text instead.
- No animation for show. The candle is a static line drawing; lighting it only adds the flame.
- Photos carry the page. Sample photos are plain grey.
- Names and stories first; interface text short and plain.
