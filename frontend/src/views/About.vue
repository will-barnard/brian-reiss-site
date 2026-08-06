<script setup>
import { computed, reactive } from 'vue';
import { store } from '../store';
import { imageUrl, apiSend } from '../api';

const s = computed(() => store.settings || {});
const about = computed(() => s.value.about || {});
const contact = computed(() => s.value.contact || {});
const img = computed(() => imageUrl(about.value.imageId));
const paragraphs = computed(() =>
  (about.value.body || '').split('\n').filter((p) => p.trim())
);

const form = reactive({ name: '', email: '', body: '' });
const state = reactive({ sending: false, ok: false, err: '' });

async function submit() {
  state.err = '';
  if (!form.body.trim()) {
    state.err = 'Please write a message.';
    return;
  }
  state.sending = true;
  try {
    await apiSend('POST', '/contact', { ...form });
    state.ok = true;
    form.name = form.email = form.body = '';
  } catch (e) {
    state.err = e.message;
  } finally {
    state.sending = false;
  }
}
</script>

<template>
  <section class="page-head sky-gradient">
    <div class="container">
      <p class="eyebrow" style="color: var(--accent)">Get to know me</p>
      <h1 class="page-title">{{ about.title || 'About' }}</h1>
    </div>
  </section>

  <section class="section">
    <div class="container about-grid">
      <div class="about-photo">
        <img v-if="img" :src="img" alt="Brian Reiss" />
        <div v-else class="photo-placeholder">Add a photo in the admin panel</div>
      </div>
      <div>
        <p v-for="(p, i) in paragraphs" :key="i" class="about-para">{{ p }}</p>
      </div>
    </div>
  </section>

  <section class="section-tight contact-band">
    <div class="container contact-grid">
      <div>
        <h2 class="section-title">Contact</h2>
        <p class="section-lead">{{ contact.blurb }}</p>
        <p v-if="contact.email" style="margin-top: 1rem">
          <a :href="`mailto:${contact.email}`" class="btn btn-dark">{{
            contact.email
          }}</a>
        </p>
        <p class="muted" style="margin-top: 1.5rem">
          Have a question about the work itself?
          <router-link to="/ask" style="color: var(--accent-strong); font-weight: 600"
            >Ask it here →</router-link
          >
        </p>
      </div>
      <form class="contact-form" @submit.prevent="submit">
        <div v-if="state.ok" class="notice notice-ok">
          Thanks — your message is on its way to Brian.
        </div>
        <div v-if="state.err" class="notice notice-err">{{ state.err }}</div>
        <div class="field">
          <label>Name</label>
          <input v-model="form.name" class="input" type="text" />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" class="input" type="email" />
        </div>
        <div class="field">
          <label>Message</label>
          <textarea v-model="form.body" class="textarea"></textarea>
        </div>
        <button class="btn btn-primary" :disabled="state.sending">
          {{ state.sending ? 'Sending…' : 'Send message' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.page-head {
  padding: 4rem 0 3.5rem;
  color: var(--on-dark);
}
.page-title {
  color: #fff;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  margin: 0.3rem 0 0;
}
.about-grid {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 3rem;
  align-items: start;
}
.about-photo {
  aspect-ratio: 4 / 5;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(43, 32, 19, 0.16);
  background: linear-gradient(160deg, var(--grad-mid), var(--grad-top));
}
.about-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--on-dark-soft);
  text-align: center;
  padding: 1.5rem;
  font-family: var(--font-serif);
}
.about-para {
  font-size: 1.12rem;
  color: var(--ink-soft);
  margin: 0 0 1.1rem;
}
.contact-band {
  background: var(--paper);
  border-top: 1px solid rgba(43, 32, 19, 0.08);
}
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}
.contact-form {
  background: #fffaf1;
  padding: 1.8rem;
  border-radius: 18px;
  box-shadow: 0 16px 44px rgba(43, 32, 19, 0.1);
}
@media (max-width: 780px) {
  .about-grid,
  .contact-grid {
    grid-template-columns: 1fr;
  }
  .about-photo {
    max-width: 320px;
  }
}
</style>
