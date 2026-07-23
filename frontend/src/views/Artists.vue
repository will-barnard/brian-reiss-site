<script setup>
import { computed } from 'vue';
import { store } from '../store';
import { imageUrl } from '../api';

const artists = computed(() => store.artists);
const heading = computed(
  () => (store.settings.artists || {}).heading || 'Collaborators & Artists'
);
const blurb = computed(() => (store.settings.artists || {}).blurb || '');
</script>

<template>
  <section class="page-head sky-gradient">
    <div class="container">
      <p class="eyebrow" style="color: var(--accent)">Credits</p>
      <h1 class="page-title">{{ heading }}</h1>
      <p v-if="blurb" class="head-lead">{{ blurb }}</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="grid grid-2">
        <article v-for="a in artists" :key="a.id" class="artist">
          <div class="artist-img">
            <img v-if="a.image_id" :src="imageUrl(a.image_id)" alt="" />
            <span v-else>{{ a.name }}</span>
          </div>
          <div class="artist-body">
            <h3>{{ a.name }}</h3>
            <p class="card-text">{{ a.blurb }}</p>
            <a
              v-if="a.link"
              :href="a.link"
              target="_blank"
              rel="noopener"
              class="artist-link"
              >Visit their work →</a
            >
          </div>
        </article>
      </div>
      <p v-if="!artists.length" class="muted">No artists listed yet.</p>
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
  margin: 0.3rem 0 0.6rem;
}
.head-lead {
  color: var(--on-dark);
  opacity: 0.92;
  max-width: 58ch;
}
.artist {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1.4rem;
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 12px 34px rgba(16, 35, 63, 0.09);
  border: 1px solid rgba(16, 35, 63, 0.06);
}
.artist-img {
  width: 120px;
  height: 120px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(160deg, var(--grad-mid), var(--grad-top));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--on-dark-soft);
  text-align: center;
  font-size: 0.85rem;
  padding: 0.5rem;
}
.artist-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.artist-body h3 {
  margin: 0 0 0.4rem;
  font-size: 1.35rem;
}
.artist-link {
  color: var(--accent-strong);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-block;
  margin-top: 0.5rem;
}
@media (max-width: 520px) {
  .artist {
    grid-template-columns: 1fr;
  }
}
</style>
