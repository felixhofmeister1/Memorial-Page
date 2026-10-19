# Remembered: the memorial website

A memorial for the Padre Wasson family: one page for each brother and sister who has died,
with their portrait, dates, home, story, photo albums, words from family and friends, and a
candle. English, German and Spanish.

**Live:** <https://felixhofmeister1.github.io/Memorial-Page/>

## Everything stays in your browser

There is no server and no account. Everything you add (people, stories, photos, words,
candles) is saved in the browser you use, on that device, in its IndexedDB storage. Nobody
else sees it, and nothing is sent anywhere; the page does not even load fonts from elsewhere
(see the Content-Security-Policy in `vite.config.ts`).

So:

- On another device or in another browser, the memorial starts empty.
- If the browser's site data is cleared, the memorial is gone.
- **About & backup → Save a backup file** writes one `.json` file with everything, photos
  included. **Restore from a backup** brings it back, in the same or another browser.
  The home page reminds you when there are changes that are not in a backup yet.

## What it does

- **Everyone:** all pages as a wall of portraits; search (accents don't matter), filter by
  country, home and year of death, sort by name, date of death or recently added.
  "Remembered this month" lists the anniversaries of the month.
- **A memorial page:** portrait, name, the name they were known by, dates (a year alone is
  fine), age when both dates are known well enough, home and country, story, albums with a
  full-screen photo viewer (arrow keys and swiping work), words from family and friends
  (with an optional photo; edit and remove), and a candle with optional name and words.
  Print-friendly.
- **Add someone / Edit this page:** details, portrait, photos (several at once, captions,
  "photo from", albums, reordering, "use as portrait"), albums, delete.
- Photos are turned upright, scaled down (2000 px, plus a 720 px version for lists) and saved
  again as JPEG in the browser, which also removes camera data such as the location.

## Working on it

```bash
cd website
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck, then build into dist/
```

Addresses use `#/…` (for example `#/m/lupita-ramirez`), so every page works on GitHub Pages.
The built `dist/` folder is what the `gh-pages` branch holds.

```
src/data/       browser storage: people, albums, photos, words, candles, images; backup
src/pages/      Home, Memorial, Edit, About, NotFound
src/components/ candle, portrait, photo viewer, words, date fields, …
src/i18n/       English, German, Spanish
src/styles/     site.css (all colours and type at the top)
```
