<script setup>
import { computed, reactive } from 'vue';
import { store } from '../store';
import { apiSend } from '../api';

const qa = computed(() => store.settings.qa || {});
const questions = computed(() => store.questions);

const form = reactive({ name: '', question: '' });
const state = reactive({ sending: false, ok: false, err: '' });

async function submit() {
  state.err = '';
  if (!form.question.trim()) {
    state.err = 'Please write a question.';
    return;
  }
  state.sending = true;
  try {
    await apiSend('POST', '/questions', { ...form });
    state.ok = true;
    form.name = form.question = '';
  } catch (e) {
    state.err = e.message;
  } finally {
    state.sending = false;
  }
}
</script>

<template>
<div class="route-page">
  <section class="page-head sky-gradient">
    <div class="container">
      <p class="eyebrow" style="color: var(--accent)">For Readers</p>
      <h1 class="page-title">{{ qa.heading || 'Ask Me Anything' }}</h1>
      <p v-if="qa.blurb" class="head-lead">{{ qa.blurb }}</p>
    </div>
  </section>

  <section class="section">
    <div class="container ask-grid">
      <form class="ask-form" @submit.prevent="submit">
        <h2 style="margin-top: 0">Ask a question</h2>
        <div v-if="state.ok" class="notice notice-ok">
          Got it! Brian reads every question and answers what he can right here.
        </div>
        <div v-if="state.err" class="notice notice-err">{{ state.err }}</div>
        <div class="field">
          <label>Name <span class="muted">(optional)</span></label>
          <input v-model="form.name" class="input" placeholder="Anonymous" />
        </div>
        <div class="field">
          <label>Your question</label>
          <textarea
            v-model="form.question"
            class="textarea"
            placeholder="Ask about a character, a world, the writing process…"
          ></textarea>
        </div>
        <button class="btn btn-primary" :disabled="state.sending">
          {{ state.sending ? 'Sending…' : 'Submit question' }}
        </button>
      </form>

      <div class="answered">
        <h2 style="margin-top: 0">Answered</h2>
        <div class="stack">
          <div v-for="q in questions" :key="q.id" class="qa-item">
            <div class="qa-asker">{{ q.name || 'Anonymous' }} asked</div>
            <p class="qa-q">{{ q.question }}</p>
            <p class="qa-a">{{ q.answer }}</p>
          </div>
          <p v-if="!questions.length" class="muted">
            No answered questions yet — be the first to ask.
          </p>
        </div>
      </div>
    </div>
  </section>
</div>
</template>

<style scoped>
.page-head {
  padding: 4rem 0 3.5rem;
  color: var(--on-dark);
}
.page-title {
  color: #fff;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  margin: 0.3rem 0 0.6rem;
}
.head-lead {
  color: var(--on-dark);
  opacity: 0.92;
  max-width: 58ch;
}
.ask-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 3rem;
  align-items: start;
}
.ask-form {
  background: #fffaf1;
  padding: 1.8rem;
  border-radius: 18px;
  box-shadow: 0 16px 44px rgba(43, 32, 19, 0.1);
  position: sticky;
  top: 90px;
}
@media (max-width: 800px) {
  .ask-grid {
    grid-template-columns: 1fr;
  }
  .ask-form {
    position: static;
  }
}
</style>
