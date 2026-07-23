<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { apiGet, apiSend, getToken, setToken } from '../api';
import { applyTheme } from '../store';
import CollectionEditor from '../components/CollectionEditor.vue';
import ImageField from '../components/ImageField.vue';

const authed = ref(false);
const loading = ref(true);
const password = ref('');
const loginErr = ref('');
const data = ref(null);
const tab = ref('design');

const tabs = [
  { id: 'design', label: 'Design & Text' },
  { id: 'books', label: 'Books' },
  { id: 'merch', label: 'Merch' },
  { id: 'appearances', label: 'Appearances' },
  { id: 'artists', label: 'Artists' },
  { id: 'questions', label: 'Questions' },
  { id: 'messages', label: 'Messages' },
];

onMounted(async () => {
  if (getToken()) await loadData();
  loading.value = false;
});

async function loadData() {
  try {
    data.value = await apiGet('/admin/data');
    authed.value = true;
    applyTheme(data.value.settings.theme);
    hydrateSettings();
  } catch {
    authed.value = false;
    setToken('');
  }
}

async function login() {
  loginErr.value = '';
  try {
    const { token } = await apiSend('POST', '/admin/login', {
      password: password.value,
    });
    setToken(token);
    password.value = '';
    await loadData();
  } catch (e) {
    loginErr.value = e.message;
  }
}

function logout() {
  setToken('');
  authed.value = false;
  data.value = null;
}

/* ---------- Settings (Design & Text) ---------- */
const settings = reactive({});
const settingsSaved = ref(false);
const settingsErr = ref('');

function hydrateSettings() {
  Object.assign(settings, JSON.parse(JSON.stringify(data.value.settings || {})));
  settings.hero = settings.hero || {};
  settings.about = settings.about || {};
  settings.contact = settings.contact || {};
  settings.qa = settings.qa || {};
  settings.appearances = settings.appearances || {};
  settings.artists = settings.artists || {};
  settings.merch = settings.merch || {};
  settings.social = settings.social || [];
}

async function saveSettings() {
  settingsErr.value = '';
  try {
    await apiSend('PUT', '/admin/settings', JSON.parse(JSON.stringify(settings)));
    applyTheme(settings.theme);
    settingsSaved.value = true;
    setTimeout(() => (settingsSaved.value = false), 1800);
  } catch (e) {
    settingsErr.value = e.message;
  }
}

function addSocial() {
  settings.social.push({ platform: '', url: '' });
}
function removeSocial(i) {
  settings.social.splice(i, 1);
}

/* ---------- Questions ---------- */
const qErr = ref('');
async function saveQuestion(q) {
  qErr.value = '';
  try {
    await apiSend('PUT', `/admin/questions/${q.id}`, {
      answer: q.answer,
      published: q.published,
    });
    q._saved = true;
    setTimeout(() => (q._saved = false), 1500);
  } catch (e) {
    qErr.value = e.message;
  }
}
async function publishQuestion(q) {
  q.published = !q.published;
  await saveQuestion(q);
}
async function deleteQuestion(q) {
  if (!confirm('Delete this question?')) return;
  await apiSend('DELETE', `/admin/questions/${q.id}`);
  data.value.questions = data.value.questions.filter((x) => x.id !== q.id);
}
const unanswered = computed(() =>
  (data.value?.questions || []).filter((q) => !q.answer || !q.answer.trim())
);
const answered = computed(() =>
  (data.value?.questions || []).filter((q) => q.answer && q.answer.trim())
);

/* ---------- Messages ---------- */
async function toggleRead(m) {
  m.read = !m.read;
  await apiSend('PUT', `/admin/messages/${m.id}`, { read: m.read });
}
async function deleteMessage(m) {
  if (!confirm('Delete this message?')) return;
  await apiSend('DELETE', `/admin/messages/${m.id}`);
  data.value.messages = data.value.messages.filter((x) => x.id !== m.id);
}
</script>

<template>
  <div v-if="loading" class="admin-loading">Loading…</div>

  <!-- Login -->
  <div v-else-if="!authed" class="login-wrap sky-gradient">
    <form class="login-card" @submit.prevent="login">
      <h1 style="margin-top: 0">Admin</h1>
      <p class="muted">Sign in to edit your site.</p>
      <div v-if="loginErr" class="notice notice-err">{{ loginErr }}</div>
      <div class="field">
        <label>Password</label>
        <input v-model="password" type="password" class="input" autofocus />
      </div>
      <button class="btn btn-primary" style="width: 100%">Sign in</button>
      <p style="margin-top: 1.2rem; text-align: center">
        <router-link to="/" class="muted" style="font-size: 0.9rem"
          >← Back to site</router-link
        >
      </p>
    </form>
  </div>

  <!-- Dashboard -->
  <div v-else class="admin">
    <aside class="side">
      <div class="side-brand">Site Editor</div>
      <nav class="side-nav">
        <button
          v-for="t in tabs"
          :key="t.id"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >
          {{ t.label }}
          <span
            v-if="t.id === 'questions' && unanswered.length"
            class="badge"
            >{{ unanswered.length }}</span
          >
          <span
            v-if="t.id === 'messages' && data.messages.filter((m) => !m.read).length"
            class="badge"
            >{{ data.messages.filter((m) => !m.read).length }}</span
          >
        </button>
      </nav>
      <div class="side-foot">
        <a href="/" target="_blank" class="btn btn-dark tiny" style="width: 100%"
          >View site ↗</a
        >
        <button class="btn tiny linkbtn" @click="logout">Sign out</button>
      </div>
    </aside>

    <main class="content">
      <!-- DESIGN & TEXT -->
      <section v-show="tab === 'design'">
        <div class="editor-head">
          <h2 style="margin: 0">Design &amp; Text</h2>
          <button class="btn btn-primary" @click="saveSettings">Save changes</button>
        </div>
        <div v-if="settingsSaved" class="notice notice-ok">Saved ✓</div>
        <div v-if="settingsErr" class="notice notice-err">{{ settingsErr }}</div>

        <div class="panel">
          <h3>Site basics</h3>
          <div class="two">
            <div class="field">
              <label>Site title</label>
              <input v-model="settings.siteTitle" class="input" />
            </div>
            <div class="field">
              <label>Tagline</label>
              <input v-model="settings.tagline" class="input" />
            </div>
          </div>
          <div class="field">
            <label>Color theme</label>
            <select v-model="settings.theme" class="select">
              <option value="sky">Sky (blue gradient)</option>
              <option value="purple">Purple</option>
              <option value="green">Green</option>
            </select>
          </div>
          <div class="field">
            <label>Footer text</label>
            <input v-model="settings.footerText" class="input" />
          </div>
        </div>

        <div class="panel">
          <h3>Home hero</h3>
          <div class="field">
            <label>Heading</label>
            <input v-model="settings.hero.heading" class="input" />
          </div>
          <div class="field">
            <label>Subheading</label>
            <textarea v-model="settings.hero.subheading" class="textarea"></textarea>
          </div>
          <div class="two">
            <div class="field">
              <label>Button label</label>
              <input v-model="settings.hero.ctaLabel" class="input" />
            </div>
            <div class="field">
              <label>Button link</label>
              <input v-model="settings.hero.ctaLink" class="input" placeholder="/books" />
            </div>
          </div>
          <ImageField
            label="Hero photo"
            shape="portrait"
            v-model="settings.hero.imageId"
          />
        </div>

        <div class="panel">
          <h3>About page</h3>
          <div class="field">
            <label>Title</label>
            <input v-model="settings.about.title" class="input" />
          </div>
          <div class="field">
            <label>Body (blank line = new paragraph)</label>
            <textarea
              v-model="settings.about.body"
              class="textarea"
              style="min-height: 200px"
            ></textarea>
          </div>
          <ImageField label="About photo" shape="portrait" v-model="settings.about.imageId" />
        </div>

        <div class="panel">
          <h3>Contact</h3>
          <div class="field">
            <label>Contact email</label>
            <input v-model="settings.contact.email" class="input" />
          </div>
          <div class="field">
            <label>Contact blurb</label>
            <textarea v-model="settings.contact.blurb" class="textarea"></textarea>
          </div>
        </div>

        <div class="panel">
          <h3>Section intros</h3>
          <div v-for="key in ['qa', 'appearances', 'artists', 'merch']" :key="key">
            <div class="two">
              <div class="field">
                <label>{{ key.toUpperCase() }} heading</label>
                <input v-model="settings[key].heading" class="input" />
              </div>
              <div class="field">
                <label>{{ key.toUpperCase() }} blurb</label>
                <input v-model="settings[key].blurb" class="input" />
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>Social links</h3>
          <p class="muted" style="font-size: 0.9rem; margin-top: 0">
            Shown in the site footer.
          </p>
          <div v-for="(sl, i) in settings.social" :key="i" class="social-edit">
            <input
              v-model="sl.platform"
              class="input"
              placeholder="Platform (e.g. Instagram)"
            />
            <input v-model="sl.url" class="input" placeholder="https://…" />
            <button class="iconbtn danger" @click="removeSocial(i)">✕</button>
          </div>
          <button class="btn btn-dark tiny" @click="addSocial">+ Add link</button>
        </div>

        <div style="margin: 2rem 0 4rem">
          <button class="btn btn-primary" @click="saveSettings">Save changes</button>
        </div>
      </section>

      <!-- COLLECTIONS -->
      <section v-show="tab === 'books'">
        <CollectionEditor
          v-if="data"
          title="Books"
          type="books"
          add-label="Add book"
          :initial="data.books"
          :fields="[
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'subtitle', label: 'Subtitle / series', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'cover_image_id', label: 'Cover image', type: 'image', shape: 'portrait' },
            { key: 'buy_link', label: 'Buy link (URL)', type: 'text', placeholder: 'https://…', hint: 'Where readers can purchase — Amazon, bookshop, etc.' },
          ]"
        />
      </section>

      <section v-show="tab === 'merch'">
        <CollectionEditor
          v-if="data"
          title="Merch"
          type="merch"
          add-label="Add item"
          :initial="data.merch"
          :fields="[
            { key: 'title', label: 'Item name', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'price', label: 'Price (display text)', type: 'text', placeholder: '$28' },
            { key: 'image_id', label: 'Product image', type: 'image', shape: 'wide' },
            { key: 'stripe_link', label: 'Stripe Payment Link', type: 'text', placeholder: 'https://buy.stripe.com/…', hint: 'Create a Payment Link in your Stripe dashboard and paste it here.' },
          ]"
        />
      </section>

      <section v-show="tab === 'appearances'">
        <CollectionEditor
          v-if="data"
          title="Public Appearances"
          type="appearances"
          add-label="Add entry"
          :initial="data.appearances"
          :fields="[
            { key: 'title', label: 'Event title', type: 'text' },
            { key: 'event_date', label: 'Date (display text)', type: 'text', placeholder: 'May 2026' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'body', label: 'Journal entry', type: 'textarea' },
            { key: 'image_id', label: 'Photo', type: 'image', shape: 'wide' },
          ]"
        />
      </section>

      <section v-show="tab === 'artists'">
        <CollectionEditor
          v-if="data"
          title="Artists & Collaborators"
          type="artists"
          add-label="Add artist"
          :initial="data.artists"
          :fields="[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'blurb', label: 'About them / their contribution', type: 'textarea' },
            { key: 'link', label: 'Link to their work (URL)', type: 'text', placeholder: 'https://…' },
            { key: 'image_id', label: 'Portrait or sample art', type: 'image', shape: 'square' },
          ]"
        />
      </section>

      <!-- QUESTIONS -->
      <section v-show="tab === 'questions'">
        <h2 style="margin-top: 0">Reader Questions</h2>
        <div v-if="qErr" class="notice notice-err">{{ qErr }}</div>

        <h3>Awaiting answer ({{ unanswered.length }})</h3>
        <p v-if="!unanswered.length" class="muted">No new questions right now.</p>
        <div class="stack">
          <div v-for="q in unanswered" :key="q.id" class="qcard">
            <div class="qcard-head">
              <strong>{{ q.name || 'Anonymous' }}</strong>
              <button class="iconbtn danger" @click="deleteQuestion(q)">✕</button>
            </div>
            <p class="qtext">{{ q.question }}</p>
            <div class="field">
              <label>Your answer</label>
              <textarea v-model="q.answer" class="textarea"></textarea>
            </div>
            <div class="qactions">
              <button class="btn btn-primary tiny" @click="((q.published = true), saveQuestion(q))">
                Answer &amp; publish
              </button>
              <button class="btn btn-dark tiny" @click="saveQuestion(q)">Save draft</button>
              <span v-if="q._saved" class="tag ok">Saved ✓</span>
            </div>
          </div>
        </div>

        <h3 style="margin-top: 2.5rem">Answered ({{ answered.length }})</h3>
        <div class="stack">
          <div v-for="q in answered" :key="q.id" class="qcard">
            <div class="qcard-head">
              <strong>{{ q.name || 'Anonymous' }}</strong>
              <div style="display: flex; gap: 0.5rem; align-items: center">
                <label class="pubtoggle">
                  <input type="checkbox" :checked="q.published" @change="publishQuestion(q)" />
                  {{ q.published ? 'Public' : 'Hidden' }}
                </label>
                <button class="iconbtn danger" @click="deleteQuestion(q)">✕</button>
              </div>
            </div>
            <p class="qtext">{{ q.question }}</p>
            <div class="field">
              <label>Answer</label>
              <textarea v-model="q.answer" class="textarea" @blur="saveQuestion(q)"></textarea>
            </div>
            <span v-if="q._saved" class="tag ok">Saved ✓</span>
          </div>
        </div>
      </section>

      <!-- MESSAGES -->
      <section v-show="tab === 'messages'">
        <h2 style="margin-top: 0">Contact Messages</h2>
        <p v-if="!data.messages.length" class="muted">No messages yet.</p>
        <div class="stack">
          <div
            v-for="m in data.messages"
            :key="m.id"
            class="qcard"
            :style="{ opacity: m.read ? 0.7 : 1 }"
          >
            <div class="qcard-head">
              <strong>{{ m.name || 'No name' }}</strong>
              <div style="display: flex; gap: 0.5rem; align-items: center">
                <button class="btn tiny btn-dark" @click="toggleRead(m)">
                  {{ m.read ? 'Mark unread' : 'Mark read' }}
                </button>
                <button class="iconbtn danger" @click="deleteMessage(m)">✕</button>
              </div>
            </div>
            <p class="muted" style="margin: 0 0 0.5rem; font-size: 0.9rem">
              <a v-if="m.email" :href="`mailto:${m.email}`">{{ m.email }}</a>
            </p>
            <p class="qtext">{{ m.body }}</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-loading {
  padding: 4rem;
  text-align: center;
  color: var(--ink-soft);
}
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.login-card {
  background: #fff;
  border-radius: 18px;
  padding: 2.2rem;
  width: min(400px, 100%);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.3);
}
.admin {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: #eef2f8;
}
.side {
  background: #0e2242;
  color: #cfe0f2;
  padding: 1.4rem 1rem;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}
.side-brand {
  font-family: var(--font-serif);
  font-size: 1.3rem;
  color: #fff;
  padding: 0 0.6rem 1.2rem;
}
.side-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}
.side-nav button {
  text-align: left;
  background: transparent;
  border: none;
  color: #b9cbe2;
  padding: 0.65rem 0.8rem;
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.side-nav button:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}
.side-nav button.active {
  background: var(--accent-strong);
  color: #241603;
}
.badge {
  background: #e9a94d;
  color: #241603;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.05rem 0.45rem;
}
.side-nav button.active .badge {
  background: #241603;
  color: #f4c98a;
}
.side-foot {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
}
.content {
  padding: 2.2rem 2.4rem 4rem;
  max-width: 900px;
}
.panel {
  background: #fff;
  border-radius: 14px;
  padding: 1.4rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(16, 35, 63, 0.06);
}
.panel h3 {
  margin: 0 0 1rem;
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.editor-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
  gap: 1rem;
}
.social-edit {
  display: grid;
  grid-template-columns: 1fr 1.4fr auto;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.qcard {
  background: #fff;
  border-radius: 12px;
  padding: 1.2rem 1.3rem;
  box-shadow: 0 8px 22px rgba(16, 35, 63, 0.06);
}
.qcard-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.qtext {
  font-size: 1.05rem;
  color: var(--ink);
  margin: 0 0 0.8rem;
}
.qactions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.tiny {
  font-size: 0.82rem;
  padding: 0.45rem 0.9rem;
}
.linkbtn {
  background: transparent;
  color: #cfe0f2;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.iconbtn {
  border: 1px solid rgba(16, 35, 63, 0.15);
  background: #fff;
  border-radius: 8px;
  width: 30px;
  height: 30px;
  cursor: pointer;
}
.iconbtn.danger {
  color: #a02525;
  border-color: #f0c9c9;
}
.pubtoggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.tag.ok {
  color: #1c6b3f;
  font-size: 0.8rem;
}
@media (max-width: 720px) {
  .admin {
    grid-template-columns: 1fr;
  }
  .side {
    position: static;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .side-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .two {
    grid-template-columns: 1fr;
  }
}
</style>
