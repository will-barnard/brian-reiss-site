<script setup>
import { ref } from 'vue';
import { apiSend } from '../api';
import ImageField from './ImageField.vue';

const props = defineProps({
  title: String,
  type: String, // books | merch | appearances | artists
  fields: Array, // [{ key, label, type, shape, placeholder, hint }]
  initial: Array,
  addLabel: { type: String, default: 'Add item' },
});

const items = ref(props.initial.map((x) => ({ ...x })));
const savingId = ref(null);
const savedId = ref(null);
const err = ref('');

function editablePayload(item) {
  const p = { published: item.published };
  for (const f of props.fields) p[f.key] = item[f.key];
  return p;
}

async function save(item) {
  err.value = '';
  savingId.value = item.id;
  try {
    await apiSend('PUT', `/admin/${props.type}/${item.id}`, editablePayload(item));
    savedId.value = item.id;
    setTimeout(() => {
      if (savedId.value === item.id) savedId.value = null;
    }, 1500);
  } catch (e) {
    err.value = e.message;
  } finally {
    savingId.value = null;
  }
}

async function add() {
  err.value = '';
  try {
    const row = await apiSend('POST', `/admin/${props.type}`);
    // New items are created at the top of the list on the backend
    // (lowest sort_order) — mirror that here so the UI doesn't jump.
    items.value.unshift(row);
  } catch (e) {
    err.value = e.message;
  }
}

async function remove(item, i) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  try {
    await apiSend('DELETE', `/admin/${props.type}/${item.id}`);
    items.value.splice(i, 1);
  } catch (e) {
    err.value = e.message;
  }
}

async function move(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= items.value.length) return;
  const arr = items.value;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  try {
    await apiSend('POST', `/admin/${props.type}/reorder`, {
      ids: arr.map((x) => x.id),
    });
  } catch (e) {
    err.value = e.message;
  }
}

function togglePublish(item) {
  item.published = !item.published;
  save(item);
}

function onImage(item, key, val) {
  item[key] = val;
  save(item);
}

function titleOf(item) {
  return item.title || item.name || '(untitled)';
}
</script>

<template>
  <div>
    <div class="editor-head">
      <div>
        <h2 style="margin: 0">{{ title }}</h2>
        <p class="muted" style="margin: 0.2rem 0 0; font-size: 0.9rem">
          Drag order with the ▲▼ arrows. Changes save automatically.
        </p>
      </div>
      <button class="btn btn-primary" @click="add">+ {{ addLabel }}</button>
    </div>

    <div v-if="err" class="notice notice-err">{{ err }}</div>

    <p v-if="!items.length" class="muted">Nothing here yet. Add your first item.</p>

    <div class="stack" style="gap: 1.4rem">
      <div v-for="(item, i) in items" :key="item.id" class="item-card">
        <div class="item-top">
          <div class="item-name">{{ titleOf(item) }}</div>
          <div class="item-tools">
            <span v-if="savingId === item.id" class="tag">Saving…</span>
            <span v-else-if="savedId === item.id" class="tag ok">Saved ✓</span>
            <button class="iconbtn" title="Move up" @click="move(i, -1)">▲</button>
            <button class="iconbtn" title="Move down" @click="move(i, 1)">▼</button>
            <label class="pubtoggle">
              <input
                type="checkbox"
                :checked="item.published"
                @change="togglePublish(item)"
              />
              {{ item.published ? 'Live' : 'Hidden' }}
            </label>
            <button class="iconbtn danger" title="Delete" @click="remove(item, i)">
              ✕
            </button>
          </div>
        </div>

        <div class="item-fields">
          <template v-for="f in fields" :key="f.key">
            <ImageField
              v-if="f.type === 'image'"
              :label="f.label"
              :shape="f.shape || 'wide'"
              :modelValue="item[f.key]"
              @update:modelValue="(v) => onImage(item, f.key, v)"
            />
            <div v-else class="field">
              <label>{{ f.label }}</label>
              <textarea
                v-if="f.type === 'textarea'"
                v-model="item[f.key]"
                class="textarea"
                :placeholder="f.placeholder"
                @blur="save(item)"
              ></textarea>
              <input
                v-else
                v-model="item[f.key]"
                class="input"
                :placeholder="f.placeholder"
                @blur="save(item)"
              />
              <span v-if="f.hint" class="muted" style="font-size: 0.8rem">{{
                f.hint
              }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.4rem;
  flex-wrap: wrap;
}
.item-card {
  background: #fff;
  border: 1px solid rgba(16, 35, 63, 0.1);
  border-radius: 14px;
  padding: 1.2rem 1.3rem 1.4rem;
  box-shadow: 0 8px 24px rgba(16, 35, 63, 0.06);
}
.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.item-name {
  font-family: var(--font-serif);
  font-size: 1.2rem;
}
.item-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.iconbtn {
  border: 1px solid rgba(16, 35, 63, 0.15);
  background: #fff;
  border-radius: 8px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 0.8rem;
}
.iconbtn:hover {
  background: #f0f4fa;
}
.iconbtn.danger {
  color: #a02525;
  border-color: #f0c9c9;
}
.pubtoggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.tag {
  font-size: 0.78rem;
  color: var(--ink-soft);
}
.tag.ok {
  color: #1c6b3f;
}
.item-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
</style>
