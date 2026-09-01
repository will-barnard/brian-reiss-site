const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { pool, init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ---------------------------------------------------------------------------
// Collection definitions: editable columns for generic admin CRUD.
// ---------------------------------------------------------------------------
const COLLECTIONS = {
  books: ['title', 'subtitle', 'description', 'cover_image_id', 'buy_link', 'published'],
  merch: ['title', 'description', 'price', 'image_id', 'stripe_link', 'published'],
  appearances: ['title', 'event_date', 'location', 'body', 'image_id', 'published'],
  artists: ['name', 'blurb', 'link', 'image_id', 'published'],
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authorized' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

// ---------------------------------------------------------------------------
// Public: hydrate the whole site in one call
// ---------------------------------------------------------------------------
app.get('/api/site', async (req, res, next) => {
  try {
    const [settings, books, merch, appearances, artists, questions] =
      await Promise.all([
        pool.query('SELECT data FROM settings WHERE id = 1'),
        pool.query('SELECT * FROM books WHERE published ORDER BY sort_order, id'),
        pool.query('SELECT * FROM merch WHERE published ORDER BY sort_order, id'),
        pool.query('SELECT * FROM appearances WHERE published ORDER BY sort_order, id'),
        pool.query('SELECT * FROM artists WHERE published ORDER BY sort_order, id'),
        pool.query(
          "SELECT id, name, question, answer FROM questions WHERE published AND answer <> '' ORDER BY sort_order, id"
        ),
      ]);
    res.json({
      settings: settings.rows[0] ? settings.rows[0].data : {},
      books: books.rows,
      merch: merch.rows,
      appearances: appearances.rows,
      artists: artists.rows,
      questions: questions.rows,
    });
  } catch (e) {
    next(e);
  }
});

// Public: submit a fan question
app.post('/api/questions', async (req, res, next) => {
  try {
    const { name, question } = req.body || {};
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }
    await pool.query(
      'INSERT INTO questions (name, question) VALUES ($1, $2)',
      [(name || 'Anonymous').slice(0, 120), question.slice(0, 4000)]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Public: contact message
app.post('/api/contact', async (req, res, next) => {
  try {
    const { name, email, body } = req.body || {};
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    await pool.query(
      'INSERT INTO messages (name, email, body) VALUES ($1, $2, $3)',
      [(name || '').slice(0, 120), (email || '').slice(0, 200), body.slice(0, 5000)]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Public: serve an image
app.get('/api/images/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT mime, data FROM images WHERE id = $1',
      [parseInt(req.params.id, 10)]
    );
    if (!rows.length) return res.status(404).end();
    res.set('Content-Type', rows[0].mime);
    res.set('Cache-Control', 'public, max-age=604800');
    res.send(rows[0].data);
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// Admin: full data (includes unpublished + messages + all questions)
// ---------------------------------------------------------------------------
app.get('/api/admin/data', requireAuth, async (req, res, next) => {
  try {
    const [settings, books, merch, appearances, artists, questions, messages] =
      await Promise.all([
        pool.query('SELECT data FROM settings WHERE id = 1'),
        pool.query('SELECT * FROM books ORDER BY sort_order, id'),
        pool.query('SELECT * FROM merch ORDER BY sort_order, id'),
        pool.query('SELECT * FROM appearances ORDER BY sort_order, id'),
        pool.query('SELECT * FROM artists ORDER BY sort_order, id'),
        pool.query('SELECT * FROM questions ORDER BY created_at DESC, id DESC'),
        pool.query('SELECT * FROM messages ORDER BY created_at DESC, id DESC'),
      ]);
    res.json({
      settings: settings.rows[0] ? settings.rows[0].data : {},
      books: books.rows,
      merch: merch.rows,
      appearances: appearances.rows,
      artists: artists.rows,
      questions: questions.rows,
      messages: messages.rows,
    });
  } catch (e) {
    next(e);
  }
});

// Admin: update settings blob
app.put('/api/admin/settings', requireAuth, async (req, res, next) => {
  try {
    const data = req.body || {};
    await pool.query(
      `INSERT INTO settings (id, data) VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [data]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Admin: upload image -> returns { id }
app.post('/api/admin/images', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { rows } = await pool.query(
      'INSERT INTO images (mime, filename, data) VALUES ($1, $2, $3) RETURNING id',
      [req.file.mimetype, req.file.originalname || 'upload', req.file.buffer]
    );
    res.json({ id: rows[0].id });
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// Admin: questions (answer / publish / delete)
// ---------------------------------------------------------------------------
app.put('/api/admin/questions/:id', requireAuth, async (req, res, next) => {
  try {
    const fields = ['name', 'question', 'answer', 'published'];
    const updates = [];
    const values = [];
    let i = 1;
    for (const col of fields) {
      if (col in req.body) {
        updates.push(`${col} = $${i++}`);
        values.push(req.body[col]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(parseInt(req.params.id, 10));
    const { rows } = await pool.query(
      `UPDATE questions SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

app.delete('/api/admin/questions/:id', requireAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM questions WHERE id = $1', [
      parseInt(req.params.id, 10),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// Admin: messages (mark read / delete)
// ---------------------------------------------------------------------------
app.put('/api/admin/messages/:id', requireAuth, async (req, res, next) => {
  try {
    await pool.query('UPDATE messages SET read = $1 WHERE id = $2', [
      !!req.body.read,
      parseInt(req.params.id, 10),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.delete('/api/admin/messages/:id', requireAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM messages WHERE id = $1', [
      parseInt(req.params.id, 10),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// Admin: generic collection CRUD (books / merch / appearances / artists).
// Registered after the questions/messages routes above — those use static
// path segments ("questions", "messages") that would otherwise be swallowed
// by the ":type" wildcard here, since Express matches routes in
// registration order regardless of how specific a segment looks.
// ---------------------------------------------------------------------------
function validCollection(req, res, next) {
  if (!COLLECTIONS[req.params.type]) {
    return res.status(404).json({ error: 'Unknown collection' });
  }
  next();
}

// Create
// New rows are inserted at the top of the list (lowest sort_order), so the
// most recently created item is what admins and visitors see first. Reorder
// (below) still overrides this whenever someone drags/moves items by hand.
app.post('/api/admin/:type', requireAuth, validCollection, async (req, res, next) => {
  try {
    const type = req.params.type;
    const { rows: minRows } = await pool.query(
      `SELECT COALESCE(MIN(sort_order), 1) - 1 AS next FROM ${type}`
    );
    const { rows } = await pool.query(
      `INSERT INTO ${type} (sort_order) VALUES ($1) RETURNING *`,
      [minRows[0].next]
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// Update
app.put('/api/admin/:type/:id', requireAuth, validCollection, async (req, res, next) => {
  try {
    const type = req.params.type;
    const allowed = COLLECTIONS[type];
    const updates = [];
    const values = [];
    let i = 1;
    for (const col of allowed) {
      if (col in req.body) {
        updates.push(`${col} = $${i++}`);
        values.push(req.body[col]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(parseInt(req.params.id, 10));
    const { rows } = await pool.query(
      `UPDATE ${type} SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// Delete
app.delete('/api/admin/:type/:id', requireAuth, validCollection, async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM ${req.params.type} WHERE id = $1`, [
      parseInt(req.params.id, 10),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Reorder: body { ids: [id, id, ...] } in desired order
app.post('/api/admin/:type/reorder', requireAuth, async (req, res, next) => {
  try {
    const type = req.params.type;
    if (!COLLECTIONS[type] && type !== 'questions') {
      return res.status(404).json({ error: 'Unknown collection' });
    }
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    for (let i = 0; i < ids.length; i++) {
      await pool.query(`UPDATE ${type} SET sort_order = $1 WHERE id = $2`, [
        i,
        parseInt(ids[i], 10),
      ]);
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
  })
  .catch((e) => {
    console.error('Failed to initialize database', e);
    process.exit(1);
  });
