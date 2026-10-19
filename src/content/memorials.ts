import type { MemorialContent } from '@/lib/data/types';

/*
 * The pages the app starts with while it has no database (see src/lib/mode.ts).
 *
 * In local mode (`npm run dev` on your own computer) these are copied once into
 * data/memorials.json; after that, add and edit memorials in the admin at /admin.
 * In preview mode (deployed without a database) this file is what the site shows.
 *
 * For now there is a single test page (`sample: true` shows the "test page" note).
 * Nothing about the person is filled in: dates, places and the story are left empty
 * on purpose, to be written by someone who knows them.
 *
 * To change a page here:
 *   - dates are 'YYYY-MM-DD'; set *_precision to 'year' or 'month' when only that is known
 *   - country is a two-letter code (MX, HN, HT, NI, GT, SV, DO, BO, PE)
 *   - photos: put files in public/memorials/<slug>/ and use '/memorials/<slug>/file.jpg'
 *   - stories: plain text, an empty line between paragraphs
 */

export const memorials: MemorialContent[] = [
  {
    id: 'f3c1e1a0-5d2b-4c8e-9a61-0f00000000f1',
    slug: 'felix-hofmeister',
    name: 'Felix Hofmeister',
    known_as: 'Felix',
    birth_date: null,
    birth_date_precision: 'day',
    death_date: null,
    death_date_precision: 'day',
    country: null,
    home: null,
    portrait_url: null,
    sample: true,
    candle_count: 0,
    story_lang: 'en',
    story: `This page is a test. It shows how a memorial looks before anything has been written about the person.

The dates, the country and NPH home, the story and the photos are filled in later. Tributes and candles that visitors leave appear here once someone from the foundation has read them.`,
    albums: [],
    tributes: [],
    candles: [],
  },
];
