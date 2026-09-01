<script setup>
import { computed, reactive } from 'vue';
import { store } from '../store';
import { imageUrl } from '../api';
import { isTextLong, truncateText } from '../textUtils';

const books = computed(() => store.books);

const expanded = reactive(new Set());
function toggle(id) {
  if (expanded.has(id)) expanded.delete(id);
  else expanded.add(id);
}
function descriptionFor(b) {
  if (expanded.has(b.id) || !isTextLong(b.description)) return b.description;
  return truncateText(b.description);
}
</script>

<template>
<div class="route-page">
  <section class="page-head sky-gradient">
    <div class="container">
      <p class="eyebrow" style="color: var(--accent)">Bibliography</p>
      <h1 class="page-title">Books</h1>
    </div>
  </section>

  <section class="section">
    <div class="container stack" style="gap: 2.5rem">
      <article v-for="b in books" :key="b.id" class="book-row">
        <div class="book-cover">
          <img v-if="b.cover_image_id" :src="imageUrl(b.cover_image_id)" alt="" />
          <span v-else>{{ b.title }}</span>
        </div>
        <div class="book-info">
          <div v-if="b.subtitle" class="card-sub">{{ b.subtitle }}</div>
          <h2>{{ b.title }}</h2>
          <p class="card-text" style="font-size: 1.05rem">{{ descriptionFor(b) }}</p>
          <button
            v-if="isTextLong(b.description)"
            class="show-more-btn"
            @click="toggle(b.id)"
          >
            {{ expanded.has(b.id) ? 'Show less' : 'Show more' }}
          </button>
          <a
            v-if="b.buy_link"
            :href="b.buy_link"
            target="_blank"
            rel="noopener"
            class="btn btn-primary"
            style="margin-top: 0.6rem; align-self: flex-start"
            >Get the book</a
          >
        </div>
      </article>
      <p v-if="!books.length" class="muted">No books published yet.</p>
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
  margin: 0.3rem 0 0;
}
.book-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2rem;
  align-items: start;
}
.book-cover {
  aspect-ratio: 3 / 4;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(43, 32, 19, 0.16);
  background: linear-gradient(160deg, var(--grad-mid), var(--grad-top));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--on-dark-soft);
  text-align: center;
  padding: 1rem;
  font-family: var(--font-serif);
}
.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.book-info {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.book-info h2 {
  margin: 0;
  font-size: 1.9rem;
}
@media (max-width: 640px) {
  .book-row {
    grid-template-columns: 1fr;
  }
  .book-cover {
    max-width: 200px;
  }
}
</style>
