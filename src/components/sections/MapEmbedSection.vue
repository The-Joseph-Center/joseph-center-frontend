<script setup lang="ts">
import { computed } from 'vue';

interface Section {
  embedUrl?: string;
  title?: string;
}

const props = defineProps<{ section?: Section | null }>();

const embedUrl = computed(() => props.section?.embedUrl?.trim() ?? '');
const title = computed(() => props.section?.title?.trim() || 'Location map');
</script>

<template>
  <section v-if="embedUrl" class="map-embed" :aria-label="title">
    <iframe
      class="map-embed__iframe"
      :src="embedUrl"
      :title="title"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
    />
  </section>
</template>

<style scoped>
.map-embed {
  width: 100%;
  background: var(--color-bg);
}

.map-embed__iframe {
  display: block;
  width: 100%;
  height: 450px;
  border: 0;
}

@media (max-width: 768px) {
  .map-embed__iframe {
    height: 320px;
  }
}
</style>
