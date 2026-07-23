const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://brianreiss:localdev@localhost:5432/brianreiss',
});

// ---------------------------------------------------------------------------
// Default (placeholder) settings blob. Everything here is editable in admin.
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  siteTitle: 'Brian Reiss',
  tagline: 'Author & Storyteller',
  theme: 'sky', // sky | purple | green
  hero: {
    heading: 'Stories that drift between the earth and the sky',
    subheading:
      'Brian Reiss writes worlds you can fall into. Explore the books, meet the artists, and join the conversation.',
    imageId: null,
    ctaLabel: 'Explore the Books',
    ctaLink: '/books',
  },
  about: {
    title: 'About Brian',
    body:
      "I'm Brian Reiss, a writer chasing the strange, luminous stories that live at the edge of the ordinary. I grew up with my nose in paperbacks and my head somewhere in the clouds, and I never really came back down.\n\nMy work spans speculative fiction, quiet fantasy, and the occasional detour into places I can't quite categorize. When I'm not writing, I'm collaborating with artists who see my worlds better than I do, or talking with readers who make the whole thing worthwhile.\n\nThis is my corner of the internet. Stay a while.",
    imageId: null,
  },
  contact: {
    email: 'hello@brianreiss.example',
    blurb:
      "Want to reach me directly? Send a note and I'll get back to you when I surface from the current manuscript.",
  },
  qa: {
    heading: 'Ask Me Anything',
    blurb:
      "Curious about a character, a world, or how a book came together? Ask away. I read everything and answer what I can right here.",
  },
  appearances: {
    heading: 'Public Appearances',
    blurb:
      "A running journal of readings, signings, and conventions — what they were actually like, from my side of the table. Upcoming events get announced on my social media first.",
  },
  artists: {
    heading: 'Collaborators & Artists',
    blurb:
      "So much of my work is made richer by artists — some I commission, some who just fall in love with a world and draw it themselves. Here are the people behind the images.",
  },
  merch: {
    heading: 'Merch',
    blurb:
      'Books, prints, and the occasional oddity. Checkout is handled securely by Stripe.',
  },
  social: [
    { platform: 'Instagram', url: 'https://instagram.com/' },
    { platform: 'Bluesky', url: 'https://bsky.app/' },
    { platform: 'X', url: 'https://x.com/' },
  ],
  footerText: '© Brian Reiss. Built among the clouds.',
};

const SEED_BOOKS = [
  {
    title: 'The Weight of Blue',
    subtitle: 'A Novel',
    description:
      'When the sky over Halden begins to fall in slow, silent sheets, a mapmaker who has never left her village must chart a route to a horizon no one believes exists.',
    buy_link: '',
    published: true,
  },
  {
    title: 'Lanterns for the Drowned',
    subtitle: 'Stories',
    description:
      'Twelve tales of people caught between worlds — a ferryman who collects last words, a lighthouse that remembers, a girl who trades her shadow for a summer.',
    buy_link: '',
    published: true,
  },
  {
    title: 'The Cartographer of Small Hours',
    subtitle: 'Book One of the Nightbound',
    description:
      'In a city where the streets rearrange themselves at midnight, only a handful of people can remember the way home. One of them is about to forget.',
    buy_link: '',
    published: true,
  },
];

const SEED_MERCH = [
  {
    title: 'The Weight of Blue — Signed Hardcover',
    description: 'First edition, signed and numbered. Ships worldwide.',
    price: '$32',
    stripe_link: '',
    published: true,
  },
  {
    title: 'Halden Map — Giclée Print',
    description: 'The full map from The Weight of Blue, 18×24", archival paper.',
    price: '$28',
    stripe_link: '',
    published: true,
  },
  {
    title: 'Nightbound Enamel Pin',
    description: 'The lantern sigil, soft enamel, 1.5".',
    price: '$12',
    stripe_link: '',
    published: true,
  },
];

const SEED_APPEARANCES = [
  {
    title: 'Riverlight Books — Launch Reading',
    event_date: 'May 2026',
    location: 'Portland, OR',
    body:
      "First stop of the tour and I was terrified. The store smelled like rain and old paper, which helped. About forty people showed, more than I expected, and a kid in the front row asked the single best question I've ever gotten about the ending. I signed until my hand cramped and then we all went for tacos.",
    published: true,
  },
  {
    title: 'Cloudfall Convention — Panel & Signing',
    event_date: 'March 2026',
    location: 'Seattle, WA',
    body:
      "Panels are strange — you're performing being a writer while other writers watch you do it. But the signing line afterward was full of people who'd actually read Lanterns, and one person brought a drawing of the ferryman that I now have framed above my desk.",
    published: true,
  },
];

const SEED_ARTISTS = [
  {
    name: 'Mara Okonkwo',
    blurb:
      'Illustrator and cover artist for The Weight of Blue. Mara works in ink and gouache and somehow makes the sky look heavy.',
    link: 'https://example.com/',
    published: true,
  },
  {
    name: 'Devon Yi',
    blurb:
      'A friend who started drawing the Nightbound streets for fun and never stopped. His fan pieces are half the reason the world feels real to me.',
    link: 'https://example.com/',
    published: true,
  },
];

const SEED_QUESTIONS = [
  {
    name: 'Priya',
    question: 'Is the mapmaker in The Weight of Blue based on a real person?',
    answer:
      "Sort of. She started as my grandmother, who never traveled but knew every road in the county by heart, and then she grew into her own stubborn self somewhere around chapter three.",
    published: true,
  },
  {
    name: 'Anonymous',
    question: 'Will there be a sequel to The Cartographer of Small Hours?',
    answer:
      "Yes — Book Two is drafted and currently being wrestled into shape. No firm date yet, but the city isn't done rearranging itself.",
    published: true,
  },
];

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      CONSTRAINT settings_singleton CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      mime TEXT NOT NULL,
      filename TEXT,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      subtitle TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      cover_image_id INT,
      buy_link TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      published BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS merch (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      price TEXT NOT NULL DEFAULT '',
      image_id INT,
      stripe_link TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      published BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS appearances (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      event_date TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      image_id INT,
      sort_order INT NOT NULL DEFAULT 0,
      published BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS artists (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      blurb TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      image_id INT,
      sort_order INT NOT NULL DEFAULT 0,
      published BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      question TEXT NOT NULL DEFAULT '',
      answer TEXT NOT NULL DEFAULT '',
      published BOOLEAN NOT NULL DEFAULT false,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  // Seed settings once
  const s = await pool.query('SELECT 1 FROM settings WHERE id = 1');
  if (s.rowCount === 0) {
    await pool.query('INSERT INTO settings (id, data) VALUES (1, $1)', [
      DEFAULT_SETTINGS,
    ]);
  }

  // Seed collections only if the whole DB is empty of them (first boot)
  await seedIfEmpty('books', SEED_BOOKS);
  await seedIfEmpty('merch', SEED_MERCH);
  await seedIfEmpty('appearances', SEED_APPEARANCES);
  await seedIfEmpty('artists', SEED_ARTISTS);
  await seedIfEmpty('questions', SEED_QUESTIONS);
}

async function seedIfEmpty(table, rows) {
  const existing = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
  if (existing.rows[0].c > 0) return;
  let order = 0;
  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = Object.values(row);
    cols.push('sort_order');
    vals.push(order++);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    await pool.query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
      vals
    );
  }
}

module.exports = { pool, init, DEFAULT_SETTINGS };
