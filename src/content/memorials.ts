import type { MemorialContent } from '@/lib/data/types';

/*
 * The memorials shown while the site has no database (preview mode, see src/lib/mode.ts).
 *
 * Everyone here is INVENTED sample content (marked `sample: true`); no real person is
 * described. The same people are in supabase/seed.sql for when the database is added.
 *
 * To add or change a page before the database exists, edit this file:
 *   - dates are 'YYYY-MM-DD'; set *_precision to 'year' or 'month' when only that is known
 *   - country is a two-letter code (MX, HN, HT, NI, GT, SV, DO, BO, PE)
 *   - photos: put files in public/memorials/<slug>/ and use '/memorials/<slug>/file.jpg'
 *   - stories: plain text, an empty line between paragraphs
 */

export const memorials: MemorialContent[] = [
  {
    id: '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01',
    slug: 'lupita-ramirez-solis',
    name: 'Guadalupe “Lupita” Ramírez Solís',
    known_as: 'Lupita',
    birth_date: '1978-01-01',
    birth_date_precision: 'year',
    death_date: '2021-02-14',
    death_date_precision: 'day',
    country: 'MX',
    home: 'Casa San Salvador, Miacatlán',
    portrait_url: null,
    sample: true,
    candle_count: 25,
    story_lang: 'en',
    story: `Lupita came to Miacatlán in the summer of 1984. She was six years old and held her two little brothers by the hand, one on each side, and she did not let go of them for weeks.

She grew up in the big house with hundreds of brothers and sisters. She was the one who knew where the lost shoes were, who sang too loud in church and who always ended up in the infirmary, first as a patient with a broken arm, later as the girl who helped the nurse with the little ones.

After secondary school she did her year of service in the baby house. That year decided her life. She studied nursing in Cuernavaca and worked for twenty years at a children's hospital. Many of us called her when a child had a fever in the middle of the night. She always answered.

Lupita married Héctor in 2004. Their daughters, Ana and Sofía, were her pride. She came back to Miacatlán every December, with a car full of presents and a big pot of tamales.

She died on 14 February 2021, after two years of illness, at home and with her family. She was 42.

Lupita, you held on to us the way you held on to your brothers. Gracias, hermana.`,
    albums: [
      {
        id: 'lupita-miacatlan',
        title: 'Miacatlán',
        description: 'Growing up in Casa San Salvador.',
        photos: [
          photo('lupita-1', 'landscape', 'Lupita with her brothers, 1985', 'Héctor'),
          photo('lupita-2', 'portrait', 'First communion', 'Héctor'),
          photo('lupita-3', 'landscape', 'Year of service in the baby house, 1996', 'María Elena'),
        ],
      },
      {
        id: 'lupita-family',
        title: 'With her family',
        description: null,
        photos: [
          photo('lupita-4', 'landscape', 'Wedding day, 2004', 'Héctor'),
          photo('lupita-5', 'landscape', 'Christmas in Miacatlán with Ana and Sofía', 'Héctor'),
        ],
      },
    ],
    tributes: [
      {
        id: 'lupita-t3',
        author_name: 'Ana',
        author_relation: 'her daughter',
        message:
          'Mamá, gracias por enseñarnos que la familia no es solo la sangre. Tus hermanos y hermanas de Miacatlán nos escriben todavía. Te queremos.',
        photo_url: null,
        created_at: '2022-02-14T12:00:00Z',
      },
      {
        id: 'lupita-t2',
        author_name: 'Gisela',
        author_relation: 'Volontärin in Miacatlán, 1995–1996',
        message:
          'Liebe Lupita, du hast mir in meiner ersten Woche gezeigt, wie man fünfzehn Babys gleichzeitig ins Bett bringt. Ich habe es nie so gut gekonnt wie du. Danke für alles. Wir denken an Héctor, Ana und Sofía.',
        photo_url: null,
        created_at: '2021-03-02T09:10:00Z',
      },
      {
        id: 'lupita-t1',
        author_name: 'María Elena',
        author_relation: 'grew up with her in Miacatlán',
        message:
          'Lupita, I still remember the night you carried me to the infirmary on your back because I was too scared to walk. You were twelve. You were always our big sister, even for the ones who were older than you.',
        photo_url: null,
        created_at: '2021-02-20T18:30:00Z',
      },
    ],
    candles: [
      { id: 'lupita-c1', author_name: 'Sofía', message: 'Feliz cumpleaños en el cielo, mamá.', created_at: '2026-09-28T08:00:00Z' },
      { id: 'lupita-c2', author_name: 'Familie Brenner', message: 'Wir denken an dich.', created_at: '2026-08-22T19:00:00Z' },
    ],
  },
  {
    id: '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02',
    slug: 'jose-antonio-mejia',
    name: 'José Antonio Mejía',
    known_as: 'Toño',
    birth_date: '1991-03-12',
    birth_date_precision: 'day',
    death_date: '2023-08-03',
    death_date_precision: 'day',
    country: 'HN',
    home: 'Rancho Santa Fe',
    portrait_url: null,
    sample: true,
    candle_count: 15,
    story_lang: 'en',
    story: `Everybody at the Rancho knew Toño. He arrived in 1999 with his sister Karla, eight years old, very thin and very serious. The seriousness lasted about a week. Then he found the football field.

He was not the best player, and he knew it. But he was the one who stayed afterwards to fold the nets and carry the balls back. That was Toño: the one who stayed afterwards.

In the carpentry workshop he found what he loved. He made his first table at fifteen. It wobbled. The second one did not, and it still stands in the dining room of one of the houses.

After his year of service he moved to Tegucigalpa and worked as a carpenter. He sent money to Karla for her studies until she finished. Every Christmas he came back to the Rancho and repaired whatever was broken, without being asked.

Toño died on 3 August 2023 in a road accident on his way to work. He was 32 years old.

Toño, the tables you made are still standing. So are we, because of people like you.`,
    albums: [
      {
        id: 'tono-rancho',
        title: 'At the Rancho',
        description: null,
        photos: [
          photo('tono-1', 'landscape', 'The football team, 2005', 'Karla'),
          photo('tono-2', 'portrait', 'In the carpentry workshop', 'Karla'),
          photo('tono-3', 'landscape', 'The table that does not wobble', 'Don Ramón'),
        ],
      },
    ],
    tributes: [
      {
        id: 'tono-t2',
        author_name: 'Don Ramón',
        author_relation: 'his teacher in the carpentry workshop',
        message: 'He was the most patient student I ever had. He measured three times and cut once. I am proud of him.',
        photo_url: null,
        created_at: '2023-08-15T15:45:00Z',
      },
      {
        id: 'tono-t1',
        author_name: 'Karla Mejía',
        author_relation: 'his sister',
        message:
          'Hermano, tú pagaste mis estudios sin decir nada a nadie. Hoy soy maestra gracias a ti. Cada vez que me siento en tu mesa, te siento conmigo.',
        photo_url: null,
        created_at: '2023-08-10T20:00:00Z',
      },
    ],
    candles: [{ id: 'tono-c1', author_name: 'Karla', message: 'Para mi hermano.', created_at: '2026-10-01T18:00:00Z' }],
  },
  {
    id: '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03',
    slug: 'nadege-belizaire',
    name: 'Nadège Bélizaire',
    known_as: 'Nadège',
    birth_date: '1999-01-01',
    birth_date_precision: 'year',
    death_date: '2019-11-21',
    death_date_precision: 'day',
    country: 'HT',
    home: 'St. Hélène, Kenscoff',
    portrait_url: null,
    sample: true,
    candle_count: 11,
    story_lang: 'en',
    story: `Nadège was the voice of the choir at St. Hélène. When she sang the first line, the whole chapel went quiet, even the smallest ones in the first row.

She came to Kenscoff as a baby, so St. Hélène was the only home she ever knew. She liked numbers as much as songs. She kept the accounts of the school shop when she was fourteen, and not a single gourde ever went missing.

Her dream was to study accounting in Port-au-Prince and then come back to help run the home. She had started her first semester when she fell ill. She was treated at the hospital in Tabarre, and her brothers and sisters took turns sitting with her.

Nadège died on 21 November 2019. She was twenty.

At her funeral the choir sang without her for the first time. It was not the same, and it never will be. Nou sonje w, Nadège. We remember you.`,
    albums: [
      {
        id: 'nadege-st-helene',
        title: 'St. Hélène',
        description: 'Photos sent by her brothers and sisters.',
        photos: [
          photo('nadege-1', 'landscape', 'Choir practice', 'Wislande'),
          photo('nadege-2', 'portrait', 'Graduation day', 'Wislande'),
        ],
      },
    ],
    tributes: [
      {
        id: 'nadege-t2',
        author_name: 'Thomas',
        author_relation: 'Pate, Freiburg',
        message: 'Liebe Nadège, deine Briefe mit den kleinen gemalten Noten am Rand habe ich alle aufbewahrt. Ruhe in Frieden.',
        photo_url: null,
        created_at: '2019-12-08T19:20:00Z',
      },
      {
        id: 'nadege-t1',
        author_name: 'Wislande',
        author_relation: 'her sister from St. Hélène',
        message: 'Nadège, every time the choir sings “Ave Maria” I hear your voice first. Rest now, sister.',
        photo_url: null,
        created_at: '2019-11-30T10:00:00Z',
      },
    ],
    candles: [{ id: 'nadege-c1', author_name: null, message: 'For Nadège, from the choir.', created_at: '2026-09-26T07:30:00Z' }],
  },
];

/** A grey placeholder photo (sample content has no real pictures). */
function photo(id: string, shape: 'landscape' | 'portrait', caption: string, contributedBy: string) {
  const [width, height] = shape === 'landscape' ? [1200, 900] : [900, 1200];
  return {
    id,
    album_id: null,
    storage_path: `/placeholders/photo-${shape}.svg`,
    thumb_path: null,
    width,
    height,
    caption,
    contributed_by: contributedBy,
  };
}
