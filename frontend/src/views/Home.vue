<script setup>
import { computed } from 'vue';
import { store } from '../store';
import { imageUrl } from '../api';

const s = computed(() => store.settings || {});
const hero = computed(() => s.value.hero || {});
const books = computed(() => store.books.slice(0, 3));
const heroImg = computed(() => imageUrl(hero.value.imageId));
</script>

<template>
<div class="route-page">
  <section class="hero sky-gradient">
    <div class="container hero-inner">
      <div class="hero-copy">
        <p class="eyebrow" style="color: var(--accent)">{{ s.tagline }}</p>
        <h1 class="hero-title">{{ hero.heading }}</h1>
        <p class="hero-sub">{{ hero.subheading }}</p>
        <div class="hero-actions">
          <router-link :to="hero.ctaLink || '/books'" class="btn btn-primary">
            {{ hero.ctaLabel || 'Explore the Books' }}
          </router-link>
          <router-link to="/ask" class="btn btn-ghost">Ask a question</router-link>
        </div>
      </div>
      <div class="hero-art">
        <div class="hero-card">
          <img v-if="heroImg" :src="heroImg" alt="" />
          <div v-else class="hero-placeholder">
            <span>Add a hero photo<br />in the admin panel</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <p class="eyebrow">Selected Works</p>
      <h2 class="section-title">Recent Books</h2>
      <div class="grid grid-3" style="margin-top: 2rem">
        <router-link
          v-for="b in books"
          :key="b.id"
          to="/books"
          class="card"
          style="text-decoration: none"
        >
          <div class="card-media">
            <img v-if="b.cover_image_id" :src="imageUrl(b.cover_image_id)" alt="" />
            <span v-else>{{ b.title }}</span>
          </div>
          <div class="card-body">
            <div v-if="b.subtitle" class="card-sub">{{ b.subtitle }}</div>
            <h3>{{ b.title }}</h3>
            <p class="card-text">{{ b.description }}</p>
          </div>
        </router-link>
      </div>
      <p v-if="!books.length" class="muted">Books will appear here once added.</p>
      <div class="center" style="margin-top: 2.4rem">
        <router-link to="/books" class="btn btn-dark">See all books</router-link>
      </div>
    </div>
  </section>

  <section class="section-tight">
    <div class="container tiles">
      <router-link to="/artists" class="tile">
        <h3>Artists &amp; Collaborators</h3>
        <p>Meet the illustrators who bring these worlds to life.</p>
      </router-link>
      <router-link to="/appearances" class="tile">
        <h3>Public Appearances</h3>
        <p>Field notes from readings, signings, and conventions.</p>
      </router-link>
      <router-link to="/ask" class="tile">
        <h3>Ask Me Anything</h3>
        <p>Questions from readers, answered in the open.</p>
      </router-link>
    </div>
  </section>
</div>
</template>

<style scoped>
.hero {
  color: var(--on-dark);
}
.hero-inner {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 3rem;
  align-items: center;
  padding: 5.5rem 0 6rem;
}
.hero-title {
  color: #fff;
  font-size: clamp(2.3rem, 5.2vw, 4rem);
  margin: 0.4rem 0 1rem;
  text-shadow: 0 2px 30px rgba(0, 0, 0, 0.25);
}
.hero-sub {
  color: var(--on-dark);
  font-size: 1.18rem;
  max-width: 46ch;
  opacity: 0.95;
}
.hero-actions {
  display: flex;
  gap: 0.9rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}
.hero-card {
  aspect-ratio: 4 / 5;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.35);
}
.hero-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--on-dark-soft);
  background: rgba(255, 255, 255, 0.12);
  font-family: var(--font-serif);
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.4rem;
}
.tile {
  display: block;
  text-decoration: none;
  padding: 1.8rem;
  border-radius: 18px;
  background: #fffaf1;
  border: 1px solid rgba(43, 32, 19, 0.07);
  box-shadow: 0 12px 34px rgba(43, 32, 19, 0.08);
  transition: transform 0.2s ease;
}
.tile:hover {
  transform: translateY(-4px);
}
.tile h3 {
  margin: 0 0 0.5rem;
  font-size: 1.3rem;
}
.tile p {
  margin: 0;
  color: var(--ink-soft);
}
@media (max-width: 820px) {
  .hero-inner {
    grid-template-columns: 1fr;
    padding: 3.5rem 0 4rem;
  }
  .hero-art {
    max-width: 320px;
    margin: 0 auto;
    order: 1;
  }
  .hero-copy {
    order: 2;
    text-align: center;
  }
  .hero-sub {
    margin-left: auto;
    margin-right: auto;
  }
  .hero-actions {
    justify-content: center;
  }
}
</style>
