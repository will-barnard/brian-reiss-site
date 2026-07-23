// In-memory smoke test: exercises the real server.js against pg-mem.
import { newDb } from 'pg-mem';
import Module from 'module';
import request from 'supertest';

// Intercept require('pg') so db.js/server.js use pg-mem's adapter.
const mem = newDb();
// pg-mem lacks now()/gen defaults edge cases but supports what we need.
const pgAdapter = mem.adapters.createPg();
const origLoad = Module._load;
Module._load = function (req, ...rest) {
  if (req === 'pg') return pgAdapter;
  return origLoad.call(this, req, ...rest);
};

process.env.ADMIN_PASSWORD = 'testpass';
process.env.JWT_SECRET = 'testsecret';
process.env.PORT = '0';

// Import server (CommonJS) after the hook is installed.
const require2 = Module.createRequire(import.meta.url);
require2('../src/server.js');

// Give init() a moment to run.
await new Promise((r) => setTimeout(r, 400));

// server.js doesn't export the app, so hit it over HTTP via its listener.
// Instead we re-require express app by importing after listen — simpler: use supertest on a fresh fetch to localhost.
// We rebuild a client against the running server by reading the port.
import http from 'http';

function api(method, path, { token, body } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        host: '127.0.0.1',
        port: global.__PORT__,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () =>
          resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null })
        );
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let pass = 0,
  fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log('  ✓', name);
  } else {
    fail++;
    console.log('  ✗', name);
  }
}

// Discover the port the server bound to.
global.__PORT__ = null;
const servers = process._getActiveHandles().filter((h) => h.address && h.listening !== undefined);
for (const h of servers) {
  try {
    const a = h.address();
    if (a && a.port) global.__PORT__ = a.port;
  } catch {}
}

if (!global.__PORT__) {
  console.error('Could not determine server port');
  process.exit(1);
}
console.log('Server on port', global.__PORT__);

try {
  const health = await api('GET', '/api/health');
  check('health ok', health.status === 200 && health.body.ok);

  const site = await api('GET', '/api/site');
  check('public /site returns settings', site.status === 200 && !!site.body.settings.siteTitle);
  check('seeded books present', Array.isArray(site.body.books) && site.body.books.length === 3);
  check('seeded published Q&A present', site.body.questions.length === 2);

  const badLogin = await api('POST', '/api/admin/login', { body: { password: 'wrong' } });
  check('bad password rejected', badLogin.status === 401);

  const login = await api('POST', '/api/admin/login', { body: { password: 'testpass' } });
  check('login returns token', login.status === 200 && !!login.body.token);
  const token = login.body.token;

  const noAuth = await api('GET', '/api/admin/data');
  check('admin data blocked without token', noAuth.status === 401);

  const adminData = await api('GET', '/api/admin/data', { token });
  check('admin data with token', adminData.status === 200 && adminData.body.messages.length === 0);

  // Create a book
  const created = await api('POST', '/api/admin/books', { token });
  check('create book', created.status === 200 && created.body.id);

  const updated = await api('PUT', `/api/admin/books/${created.body.id}`, {
    token,
    body: { title: 'Test Title', published: true, description: 'desc' },
  });
  check('update book', updated.status === 200 && updated.body.title === 'Test Title');

  // Reorder
  const reorder = await api('POST', '/api/admin/books/reorder', {
    token,
    body: { ids: [created.body.id] },
  });
  check('reorder books', reorder.status === 200);

  // Public question submit
  const q = await api('POST', '/api/questions', { body: { name: 'Fan', question: 'Why blue?' } });
  check('submit question', q.status === 200);

  // Contact submit
  const c = await api('POST', '/api/contact', { body: { name: 'A', email: 'a@b.c', body: 'hi' } });
  check('submit contact', c.status === 200);

  const adminData2 = await api('GET', '/api/admin/data', { token });
  check('question landed in inbox', adminData2.body.questions.some((x) => x.question === 'Why blue?'));
  check('message landed in inbox', adminData2.body.messages.some((x) => x.body === 'hi'));

  // Settings update
  const setRes = await api('PUT', '/api/admin/settings', {
    token,
    body: { siteTitle: 'Brian R', theme: 'purple' },
  });
  check('update settings', setRes.status === 200);

  const del = await api('DELETE', `/api/admin/books/${created.body.id}`, { token });
  check('delete book', del.status === 200);
} catch (e) {
  console.error('Test threw:', e);
  fail++;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
