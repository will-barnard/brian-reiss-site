import { reactive } from 'vue';
import { apiGet } from './api';

export const store = reactive({
  loaded: false,
  error: '',
  settings: {},
  books: [],
  merch: [],
  appearances: [],
  artists: [],
  questions: [],
});

export async function loadSite() {
  try {
    const data = await apiGet('/site');
    Object.assign(store, data);
    store.loaded = true;
    applyTheme(data.settings && data.settings.theme);
  } catch (e) {
    store.error = e.message;
    store.loaded = true;
  }
}

const THEMES = ['sky', 'purple', 'green', 'dusk', 'twilight', 'aurora'];

export function applyTheme(theme) {
  const t = THEMES.includes(theme) ? theme : 'sky';
  document.documentElement.setAttribute('data-theme', t);
}
