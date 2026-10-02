-- Sample content. Everyone here is invented; no real person is described.
-- All rows are marked sample = true so they can be removed in one go before launch:
--   delete from public.people where sample;
--   delete from public.memorial_requests where requester_email like '%@example.org';
-- Photos are plain grey placeholders.

insert into public.people (
  id, slug, name, known_as, birth_date, birth_date_precision, death_date, death_date_precision,
  country, home, story, story_lang, portrait_url, status, consent_confirmed, consent_note, minor, sample
) values
(
  '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01',
  'lupita-ramirez-solis',
  'Guadalupe “Lupita” Ramírez Solís', 'Lupita',
  '1978-01-01', 'year',
  '2021-02-14', 'day',
  'MX', 'Casa San Salvador, Miacatlán',
  $story$Lupita came to Miacatlán in the summer of 1984. She was six years old and held her two little brothers by the hand, one on each side, and she did not let go of them for weeks.

She grew up in the big house with hundreds of brothers and sisters. She was the one who knew where the lost shoes were, who sang too loud in church and who always ended up in the infirmary, first as a patient with a broken arm, later as the girl who helped the nurse with the little ones.

After secondary school she did her year of service in the baby house. That year decided her life. She studied nursing in Cuernavaca and worked for twenty years at a children's hospital. Many of us called her when a child had a fever in the middle of the night. She always answered.

Lupita married Héctor in 2004. Their daughters, Ana and Sofía, were her pride. She came back to Miacatlán every December, with a car full of presents and a big pot of tamales.

She died on 14 February 2021, after two years of illness, at home and with her family. She was 42.

Lupita, you held on to us the way you held on to your brothers. Gracias, hermana.$story$,
  'en',
  '/placeholders/portrait.svg',
  'published', true, 'Sample memorial. No real person.', false, true
),
(
  '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02',
  'jose-antonio-mejia',
  'José Antonio Mejía', 'Toño',
  '1991-03-12', 'day',
  '2023-08-03', 'day',
  'HN', 'Rancho Santa Fe',
  $story$Everybody at the Rancho knew Toño. He arrived in 1999 with his sister Karla, eight years old, very thin and very serious. The seriousness lasted about a week. Then he found the football field.

He was not the best player, and he knew it. But he was the one who stayed afterwards to fold the nets and carry the balls back. That was Toño: the one who stayed afterwards.

In the carpentry workshop he found what he loved. He made his first table at fifteen. It wobbled. The second one did not, and it still stands in the dining room of one of the houses.

After his year of service he moved to Tegucigalpa and worked as a carpenter. He sent money to Karla for her studies until she finished. Every Christmas he came back to the Rancho and repaired whatever was broken, without being asked.

Toño died on 3 August 2023 in a road accident on his way to work. He was 32 years old.

Toño, the tables you made are still standing. So are we, because of people like you.$story$,
  'en',
  '/placeholders/portrait.svg',
  'published', true, 'Sample memorial. No real person.', false, true
),
(
  '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03',
  'nadege-belizaire',
  'Nadège Bélizaire', 'Nadège',
  '1999-01-01', 'year',
  '2019-11-21', 'day',
  'HT', 'St. Hélène, Kenscoff',
  $story$Nadège was the voice of the choir at St. Hélène. When she sang the first line, the whole chapel went quiet, even the smallest ones in the first row.

She came to Kenscoff as a baby, so St. Hélène was the only home she ever knew. She liked numbers as much as songs. She kept the accounts of the school shop when she was fourteen, and not a single gourde ever went missing.

Her dream was to study accounting in Port-au-Prince and then come back to help run the home. She had started her first semester when she fell ill. She was treated at the hospital in Tabarre, and her brothers and sisters took turns sitting with her.

Nadège died on 21 November 2019. She was twenty.

At her funeral the choir sang without her for the first time. It was not the same, and it never will be. Nou sonje w, Nadège. We remember you.$story$,
  'en',
  '/placeholders/portrait.svg',
  'published', true, 'Sample memorial. No real person.', false, true
);

-- Albums with grey placeholder photos
insert into public.albums (id, person_id, title, description, sort_order) values
  ('7c1e0b63-0000-4000-8000-000000000101', '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'Miacatlán', 'Growing up in Casa San Salvador.', 0),
  ('7c1e0b63-0000-4000-8000-000000000102', '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'With her family', null, 1),
  ('7c1e0b63-0000-4000-8000-000000000201', '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', 'At the Rancho', null, 0),
  ('7c1e0b63-0000-4000-8000-000000000301', '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03', 'St. Hélène', 'Photos sent by her brothers and sisters.', 0);

insert into public.photos (person_id, album_id, storage_path, width, height, caption, contributed_by, status, sort_order) values
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', '7c1e0b63-0000-4000-8000-000000000101', '/placeholders/photo-landscape.svg', 1200, 900, 'Lupita with her brothers, 1985', 'Héctor', 'approved', 0),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', '7c1e0b63-0000-4000-8000-000000000101', '/placeholders/photo-portrait.svg', 900, 1200, 'First communion', 'Héctor', 'approved', 1),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', '7c1e0b63-0000-4000-8000-000000000101', '/placeholders/photo-landscape.svg', 1200, 900, 'Year of service in the baby house, 1996', 'María Elena', 'approved', 2),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', '7c1e0b63-0000-4000-8000-000000000102', '/placeholders/photo-landscape.svg', 1200, 900, 'Wedding day, 2004', 'Héctor', 'approved', 0),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', '7c1e0b63-0000-4000-8000-000000000102', '/placeholders/photo-landscape.svg', 1200, 900, 'Christmas in Miacatlán with Ana and Sofía', 'Héctor', 'approved', 1),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', '7c1e0b63-0000-4000-8000-000000000201', '/placeholders/photo-landscape.svg', 1200, 900, 'The football team, 2005', 'Karla', 'approved', 0),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', '7c1e0b63-0000-4000-8000-000000000201', '/placeholders/photo-portrait.svg', 900, 1200, 'In the carpentry workshop', 'Karla', 'approved', 1),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', '7c1e0b63-0000-4000-8000-000000000201', '/placeholders/photo-landscape.svg', 1200, 900, 'The table that does not wobble', 'Don Ramón', 'approved', 2),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03', '7c1e0b63-0000-4000-8000-000000000301', '/placeholders/photo-landscape.svg', 1200, 900, 'Choir practice', 'Wislande', 'approved', 0),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03', '7c1e0b63-0000-4000-8000-000000000301', '/placeholders/photo-portrait.svg', 900, 1200, 'Graduation day', 'Wislande', 'approved', 1);

-- Tributes: approved ones in three languages, and one waiting for moderation
insert into public.tributes (person_id, author_name, author_relation, message, status, locale, created_at) values
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'María Elena', 'grew up with her in Miacatlán',
   $t$Lupita, I still remember the night you carried me to the infirmary on your back because I was too scared to walk. You were twelve. You were always our big sister, even for the ones who were older than you.$t$,
   'approved', 'en', '2021-02-20 18:30:00+00'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'Gisela', 'Volontärin in Miacatlán, 1995–1996',
   $t$Liebe Lupita, du hast mir in meiner ersten Woche gezeigt, wie man fünfzehn Babys gleichzeitig ins Bett bringt. Ich habe es nie so gut gekonnt wie du. Danke für alles. Wir denken an Héctor, Ana und Sofía.$t$,
   'approved', 'de', '2021-03-02 09:10:00+00'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'Ana', 'her daughter',
   $t$Mamá, gracias por enseñarnos que la familia no es solo la sangre. Tus hermanos y hermanas de Miacatlán nos escriben todavía. Te queremos.$t$,
   'approved', 'es', '2022-02-14 12:00:00+00'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', 'Karla Mejía', 'his sister',
   $t$Hermano, tú pagaste mis estudios sin decir nada a nadie. Hoy soy maestra gracias a ti. Cada vez que me siento en tu mesa, te siento conmigo.$t$,
   'approved', 'es', '2023-08-10 20:00:00+00'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', 'Don Ramón', 'his teacher in the carpentry workshop',
   $t$He was the most patient student I ever had. He measured three times and cut once. I am proud of him.$t$,
   'approved', 'en', '2023-08-15 15:45:00+00'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03', 'Wislande', 'her sister from St. Hélène',
   $t$Nadège, every time the choir sings "Ave Maria" I hear your voice first. Rest now, sister.$t$,
   'approved', 'en', '2019-11-30 10:00:00+00'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03', 'Thomas', 'Pate, Freiburg',
   $t$Liebe Nadège, deine Briefe mit den kleinen gemalten Noten am Rand habe ich alle aufbewahrt. Ruhe in Frieden.$t$,
   'approved', 'de', '2019-12-08 19:20:00+00'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', 'Marvin', 'played football with him',
   $t$Toño, you always stayed to fold the nets. Today I folded them for you. Descansa, amigo.$t$,
   'pending', 'en', now() - interval '2 hours');

-- Candles: quiet ones count right away; ones with words are read first
insert into public.candles (person_id, author_name, message, message_status, created_at)
select '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', null, null, 'approved', now() - (g || ' days')::interval
from generate_series(1, 23) g;
insert into public.candles (person_id, author_name, message, message_status, created_at)
select '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', null, null, 'approved', now() - (g || ' days')::interval
from generate_series(1, 14) g;
insert into public.candles (person_id, author_name, message, message_status, created_at)
select '6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03', null, null, 'approved', now() - (g || ' days')::interval
from generate_series(1, 9) g;

insert into public.candles (person_id, author_name, message, message_status, created_at) values
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'Sofía', 'Feliz cumpleaños en el cielo, mamá.', 'approved', now() - interval '3 days'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a01', 'Familie Brenner', 'Wir denken an dich.', 'approved', now() - interval '40 days'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a02', 'Karla', 'Para mi hermano.', 'approved', now() - interval '5 days'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03', null, 'For Nadège, from the choir.', 'approved', now() - interval '12 days'),
  ('6b0d6a52-6f0e-4d55-9d4b-5f6a0a6e1a03', 'A friend', 'Thinking of you today.', 'pending', now() - interval '1 hour');

-- A request waiting in the queue
insert into public.memorial_requests (
  requester_name, requester_email, requester_relation, person_name, birth_date, death_date,
  country, home, story, is_minor, family_informed, locale
) values (
  'Rosa Elvira Castillo', 'rosa.castillo@example.org', 'NPH Guatemala, social worker',
  'Wilmer Ajú', 'around 2008', 'June 2025',
  'GT', 'Casa San Andrés',
  'Wilmer lived with us for nine years. His mother asked us to make a page for him so his brothers in the United States can leave a message. (Sample request; invented.)',
  true, true, 'es'
);
