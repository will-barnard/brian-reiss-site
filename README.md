# Brian Reiss — Author Website

A self-editable website for author Brian Reiss, with a public site and a
"Squarespace-lite" admin panel where Brian can change all text, photos, and
ordering himself — no code required.

**Stack:** Vue 3 (Vite) frontend · Node/Express backend · PostgreSQL · deployed on Beachhead.

---

## What's included

Public pages:

- **Home** — sky-gradient hero, featured books, quick links
- **Books** — full bibliography with covers and buy links
- **About / Contact** — bio, photo, and a contact form
- **Merch** — products that check out via Stripe Payment Links
- **Public Appearances** — a running journal of readings and events
- **Artists & Collaborators** — credits and links to other artists' work
- **Ask Me Anything** — fans submit questions; Brian answers them in the admin,
  and answered ones appear publicly

Admin panel (at `/admin`):

- Edit every heading, blurb, and body of text
- Upload / replace / remove photos by drag-and-drop (stored in the database)
- Add, delete, reorder, and hide/show books, merch, appearances, and artists
- Answer reader questions and choose which to publish
- Read contact messages
- Switch the color theme (sky / purple / green)

---

## Deploying on Beachhead

The repo already contains `beachhead.json`, `docker-compose.yml`, Dockerfiles, and
`frontend/nginx.conf` configured to Beachhead's requirements (postgres runs as a
stateful service so data survives redeploys).

**Before the first deploy, set these as global environment variables in the
Beachhead dashboard** (no Target Service, so they're shared across containers):

| Variable         | What it is                                            |
| ---------------- | ----------------------------------------------------- |
| `DB_PASSWORD`    | Any strong random string — the Postgres password      |
| `ADMIN_PASSWORD` | The password Brian uses to log in at `/admin`         |
| `JWT_SECRET`     | Any long random string — signs admin login sessions   |

Then deploy. The public service is `frontend` on port 80; nginx serves the built
Vue app and proxies `/api` to the backend.

To change the admin password later, update `ADMIN_PASSWORD` and redeploy.

---

## Setting up merch (for Brian)

Merch uses **Stripe Payment Links** — the simplest possible setup, no code:

1. In your [Stripe dashboard](https://dashboard.stripe.com/payment-links), create
   a **Payment Link** for a product (set the name, price, image, shipping).
2. Copy the link Stripe gives you (looks like `https://buy.stripe.com/...`).
3. In the site admin → **Merch**, add an item and paste the link into the
   **Stripe Payment Link** field.

Stripe handles the checkout, payment, and receipts. Nothing to maintain on the site.

---

## Using the admin panel

Go to `yoursite.com/admin`, sign in with the `ADMIN_PASSWORD`, and edit away.

- **Design & Text** changes are saved with the **Save changes** button.
- **Books / Merch / Appearances / Artists** save automatically as you edit; use
  the ▲▼ arrows to reorder and the **Live/Hidden** toggle to control visibility.
- Photos: drag an image onto the drop zone or click **Upload**.

Placeholder content is included so the site looks complete on day one — just edit
or replace it.

---

## Local development

Run the backend (needs a local Postgres, or point `DATABASE_URL` at one):

```bash
cd backend
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/brianreiss \
  ADMIN_PASSWORD=changeme JWT_SECRET=dev npm start
```

Run the frontend (proxies `/api` to `localhost:3001`):

```bash
cd frontend
npm install
npm run dev
```

Backend smoke tests (run against an in-memory Postgres, no DB needed):

```bash
cd backend
npm install
npm test
```

---

## Notes

- **Images are stored in the database** (Postgres), so they persist across
  Beachhead's blue/green redeploys along with all other content.
- **The `/api/site` endpoint** returns everything the public site needs in one
  request; the admin uses `/api/admin/*` behind a login token.
- All content is editable — nothing is hard-coded into the pages.
