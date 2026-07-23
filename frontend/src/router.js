import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import About from './views/About.vue';
import Books from './views/Books.vue';
import Merch from './views/Merch.vue';
import Appearances from './views/Appearances.vue';
import Artists from './views/Artists.vue';
import QA from './views/QA.vue';
import Admin from './views/Admin.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/books', component: Books },
  { path: '/merch', component: Merch },
  { path: '/appearances', component: Appearances },
  { path: '/artists', component: Artists },
  { path: '/ask', component: QA },
  { path: '/admin', component: Admin },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
