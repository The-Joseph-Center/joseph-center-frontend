<script setup lang="ts">
import { computed } from 'vue';
import { PortableText } from '@portabletext/vue';
import type { TypedObject } from '@portabletext/types';

interface Section {
  heading?: string;
  body?: TypedObject | TypedObject[];
  alignment?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase';
}

const props = defineProps<{ section?: Section | null }>();

const alignment = computed(() => props.section?.alignment ?? 'left');
const textTransform = computed(() => props.section?.textTransform ?? 'none');
</script>

<template>
  <section
    v-if="section?.heading || section?.body"
    class="py-16 px-6 bg-[var(--color-bg)]"
    :class="[
      `tc-align--${alignment}`,
      `tc-transform--${textTransform}`,
    ]"
  >
    <div class="max-w-3xl mx-auto">
      <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)] mb-6">{{ section.heading }}</h2>
      <div v-if="section?.body" class="legal-content text-[var(--color-text-secondary)]">
        <PortableText :value="section.body" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.tc-align--center { text-align: center; }
.tc-align--right  { text-align: right; }
.tc-transform--uppercase :deep(h2),
.tc-transform--uppercase :deep(p) {
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
</style>
