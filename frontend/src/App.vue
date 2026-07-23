<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { store } from './store';

const route = useRoute();
const menuOpen = ref(false);
const isAdmin = computed(() => route.path.startsWith('/admin'));
const social = computed(() => store.settings.social || []);
const brand = computed(() => store.settings.siteTitle || 'Brian Reiss');
const footerText = computed(
  () => store.settings.footerText || '© Brian Reiss'
);

const links = [
  { to: '/', label: 'Home' },
  { to: '/books', label: 'Books' },
  { to: '/about', label: 'About' },
  { to: '/appearances', label: 'Appearances' },
  { to: '/artists', label: 'Artists' },
  { to: '/merch', label: 'Merch' },
  { to: '/ask', label: 'Ask' },
];

function close() {
  menuOpen.value = false;
}
</script>

<template>
  <div v-if="isAdmin">
    <router-view />
  </div>

  <div v-else>
    <header class="nav">
      <div class="container nav-inner">
        <router-link class="nav-brand" to="/" @click="close">{{ brand }}</router-link>
        <button class="nav-toggle" @click="menuOpen = !menuOpen" aria-label="Menu">☰</button>
        <nav class="nav-links" :class="{ open: menuOpen }">
          <router-link
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            @click="close"
            >{{ l.label }}</router-link
          >
        </nav>
      </div>
    </header>

    <main>
      <router-view />
    </main>

    <footer class="footer sky-gradient">
      <div class="container footer-inner">
        <div>
          <div style="font-family: var(--font-serif); font-size: 1.3rem">
            {{ brand }}
          </div>
          <div class="on-dark-soft" style="opacity: 0.8; font-size: 0.9rem">
            {{ footerText }}
          </div>
        </div>
        <div class="social-row">
          <a
            v-for="s in social"
            :key="s.platform + s.url"
            :href="s.url"
            target="_blank"
            rel="noopener"
            class="social-chip"
            >{{ s.platform }}</a
          >
          <router-link to="/admin" class="social-chip" style="opacity: 0.55"
            >Admin</router-link
          >
        </div>
      </div>
    </footer>
  </div>
</template>
