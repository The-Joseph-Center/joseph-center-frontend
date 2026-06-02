<script setup lang="ts">
import { useSanity } from '@/composables/useSanity';
import { sectionMap, pageQuery } from '@/composables/useSections';
import { useRevealObserver } from '@/composables/useRevealObserver';
import { useHead } from '@unhead/vue';

const { data: page } = useSanity<{
  sections?: { _type: string; _key: string }[];
}>(pageQuery('/events/donations'));
useRevealObserver(page);

useHead({
  title: 'Event Donations — The Joseph Center',
  meta: [
    {
      name: 'description',
      content:
        'Sponsor an event or donate supplies to support The Joseph Center’s community gatherings in Grand Junction, CO.',
    },
  ],
});
</script>

<template>
  <main class="page page--event-donations">
    <template v-for="section in (page?.sections || [])" :key="section._key">
      <component
        :is="sectionMap[section._type]"
        v-if="sectionMap[section._type]"
        :section="section"
      />
    </template>
  </main>
</template>
