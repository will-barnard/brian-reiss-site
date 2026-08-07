<script setup>
import { computed } from 'vue';
import { store } from '../store';
import { imageUrl } from '../api';

const items = computed(() => store.appearances);
const heading = computed(
  () => (store.settings.appearances || {}).heading || 'Public Appearances'
);
const blurb = computed(() => (store.settings.appearances || {}).blurb || '');
</script>

<template>
<div class="route-page">
  <section class="page-head sky-gradient">
    <div class="container">
      <p class="eyebrow" style="color: var(--accent)">Field Journal</p>
      <h1 class="page-title">{{ heading }}</h1>
      <p v-if="blurb" class="head-lead">{{ blurb }}</p>
    </div>
  </section>

  <section class="section">
    <div class="container timeline">
      <article v-for="a in items" :key="a.id" class="entry">
        <div class="entry-meta">
          <div class="entry-date">{{ a.event_date }}</div>
          <div class="entry-loc">{{ a.location }}</div>
        </div>
        <div class="entry-body">
          <h2>{{ a.title }}</h2>
          <div v-if="a.image_id" class="entry-img">
            <img :src="imageUrl(a.image_id)" alt="" />
          </div>
          <p v-for="(p, i) in a.body.split('\n').filter(Boolean)" :key="i">
            {{ p }}
          </p>
        </div>
      </article>
      <p v-if="!items.length" class="muted">No appearances logged yet.</p>
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
.timeline {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}
.entry {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 2rem;
  border-left: 2px solid rgba(43, 32, 19, 0.1);
  padding-left: 2rem;
}
.entry-meta {
  position: sticky;
  top: 90px;
  align-self: start;
}
.entry-date {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  color: var(--ink);
}
.entry-loc {
  color: var(--accent-strong);
  font-weight: 600;
  font-size: 0.9rem;
}
.entry-body h2 {
  margin: 0 0 0.8rem;
  font-size: 1.6rem;
}
.entry-body p {
  color: var(--ink-soft);
  font-size: 1.06rem;
  margin: 0 0 0.9rem;
}
.entry-img {
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 14px 36px rgba(43, 32, 19, 0.14);
}
.entry-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (max-width: 680px) {
  .entry {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
  .entry-meta {
    position: static;
  }
}
</style>
