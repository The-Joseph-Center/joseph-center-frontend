<script setup lang="ts">
import { computed } from 'vue';
import { PortableText } from '@portabletext/vue';
import type { TypedObject } from '@portabletext/types';
import DiagonalSection from '@/components/sections/DiagonalSection.vue';

interface Section {
  title?: string;
  color?: 'gold' | 'green' | 'deep-green';
  body?: TypedObject | TypedObject[];
}

const props = defineProps<{ section?: Section | null }>();

const title = computed(() => props.section?.title || '');
const color = computed<'gold' | 'green' | 'deep-green'>(
  () => props.section?.color || 'gold'
);
</script>

<template>
  <DiagonalSection :title="title" :color="color">
    <div v-if="section?.body" class="diagonal-text__body">
      <PortableText :value="section.body" />
    </div>
  </DiagonalSection>
</template>

<style scoped>
.diagonal-text__body {
  max-width: 780px;
  margin: 0 auto;
}

.diagonal-text__body :deep(p) {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.8;
  margin: 0 0 1rem;
}

.diagonal-text__body :deep(p:last-child) {
  margin-bottom: 0;
}

.diagonal-text__body :deep(h3) {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 1.5rem 0 0.75rem;
}
</style>
