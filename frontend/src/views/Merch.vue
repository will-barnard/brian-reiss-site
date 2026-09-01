<script setup>
import { computed, reactive } from 'vue';
import { store } from '../store';
import { imageUrl } from '../api';
import { isTextLong, truncateText } from '../textUtils';

const merch = computed(() => store.merch);
const heading = computed(() => (store.settings.merch || {}).heading || 'Merch');
const blurb = computed(() => (store.settings.merch || {}).blurb || '');

const expanded = reactive(new Set());
function toggle(id) {
  if (expanded.has(id)) expanded.delete(id);
  else expanded.add(id);
}
function descriptionFor(m) {
  if (expanded.has(m.id) || !isTextLong(m.description)) return m.description;
  return truncateText(m.description);
}
</script>

<template>
<div class="route-page">
  <section class="page-head sky-gradient">
    <div class="container">
      <p class="eyebrow" style="color: var(--accent)">Shop</p>
      <h1 class="page-title">{{ heading }}</h1>
      <p v-if="blurb" class="head-lead">{{ blurb }}</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="grid grid-3">
        <div v-for="m in merch" :key="m.id" class="card">
          <div class="card-media wide">
            <img v-if="m.image_id" :src="imageUrl(m.image_id)" alt="" />
            <span v-else>{{ m.title }}</span>
          </div>
          <div class="card-body">
            <h3>{{ m.title }}</h3>
            <p class="card-text">{{ descriptionFor(m) }}</p>
            <button
              v-if="isTextLong(m.description)"
              class="show-more-btn"
              @click="toggle(m.id)"
            >
              {{ expanded.has(m.id) ? 'Show less' : 'Show more' }}
            </button>
            <div class="card-foot price-row">
              <span class="price">{{ m.price }}</span>
              <a
                v-if="m.stripe_link"
                :href="m.stripe_link"
                target="_blank"
                rel="noopener"
                class="btn btn-primary"
                >Buy</a
              >
              <span v-else class="muted" style="font-size: 0.85rem"
                >Coming soon</span
              >
            </div>
          </div>
        </div>
      </div>
      <p v-if="!merch.length" class="muted">No items in the shop yet.</p>
      <p class="muted center" style="margin-top: 2.5rem; font-size: 0.9rem">
        Secure checkout is handled by Stripe.
      </p>
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
  max-width: 54ch;
}
.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.price {
  font-family: var(--font-serif);
  font-size: 1.3rem;
  color: var(--ink);
}
</style>
