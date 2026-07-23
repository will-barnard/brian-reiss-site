<script setup>
import { ref } from 'vue';
import { apiUpload, imageUrl } from '../api';

const props = defineProps({
  modelValue: { type: [Number, null], default: null },
  label: { type: String, default: 'Image' },
  shape: { type: String, default: 'wide' }, // wide | portrait | square
});
const emit = defineEmits(['update:modelValue']);

const uploading = ref(false);
const err = ref('');
const dragging = ref(false);

async function handleFile(file) {
  if (!file) return;
  err.value = '';
  uploading.value = true;
  try {
    const { id } = await apiUpload('/admin/images', file);
    emit('update:modelValue', id);
  } catch (e) {
    err.value = e.message;
  } finally {
    uploading.value = false;
  }
}

function onInput(e) {
  handleFile(e.target.files[0]);
  e.target.value = '';
}
function onDrop(e) {
  dragging.value = false;
  handleFile(e.dataTransfer.files[0]);
}
</script>

<template>
  <div class="imgfield">
    <div class="imgfield-label">{{ label }}</div>
    <div
      class="drop"
      :class="[shape, { dragging }]"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <img v-if="modelValue" :src="imageUrl(modelValue)" alt="" />
      <div v-else class="drop-empty">Drag an image here or use the button</div>
    </div>
    <div class="imgfield-actions">
      <label class="btn btn-dark tiny">
        {{ uploading ? 'Uploading…' : modelValue ? 'Replace' : 'Upload' }}
        <input type="file" accept="image/*" hidden @change="onInput" />
      </label>
      <button
        v-if="modelValue"
        type="button"
        class="btn tiny linkbtn"
        @click="emit('update:modelValue', null)"
      >
        Remove
      </button>
    </div>
    <div v-if="err" class="notice notice-err" style="margin-top: 0.5rem">
      {{ err }}
    </div>
  </div>
</template>

<style scoped>
.imgfield-label {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
}
.drop {
  border: 2px dashed rgba(16, 35, 63, 0.22);
  border-radius: 12px;
  overflow: hidden;
  background: #f2f5fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.drop.dragging {
  border-color: var(--accent-strong);
  background: #fff7ea;
}
.drop.wide {
  aspect-ratio: 16 / 10;
}
.drop.portrait {
  aspect-ratio: 3 / 4;
  max-width: 220px;
}
.drop.square {
  aspect-ratio: 1 / 1;
  max-width: 200px;
}
.drop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.drop-empty {
  color: var(--ink-soft);
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem;
}
.imgfield-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.tiny {
  font-size: 0.82rem;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
}
.linkbtn {
  background: transparent;
  color: #a02525;
}
</style>
