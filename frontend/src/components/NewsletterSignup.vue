<script setup>
// Kit (ConvertKit) newsletter embed. The form markup + styles live in
// kit-form.html exactly as Kit generated them. Kit's ck.5.js only wires up
// forms that exist when it runs, and this is a single-page app (the form is
// rendered after page load and again on every visit to Home), so we
// (re)inject the script each time this component mounts.
import { onMounted, onBeforeUnmount } from 'vue';
import kitForm from './kit-form.html?raw';

const KIT_SCRIPT = 'https://f.convertkit.com/ckjs/ck.5.js';

function removeScript() {
  document.querySelectorAll(`script[src="${KIT_SCRIPT}"]`).forEach((n) => n.remove());
}

onMounted(() => {
  removeScript();
  const s = document.createElement('script');
  s.src = KIT_SCRIPT;
  s.async = true;
  document.body.appendChild(s);
});

onBeforeUnmount(removeScript);
</script>

<template>
  <div class="newsletter" v-html="kitForm"></div>
</template>

<style scoped>
.newsletter {
  max-width: 700px;
  margin: 0 auto;
}
</style>
