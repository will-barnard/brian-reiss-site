import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { loadSite } from './store';
import './style.css';

loadSite();
createApp(App).use(router).mount('#app');
