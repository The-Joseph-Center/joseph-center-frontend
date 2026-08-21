<script setup lang="ts">
import { computed } from 'vue';
import PersonCard from '@/components/ui/PersonCard.vue';
import { useSanity } from '@/composables/useSanity';
import type { SanityImageSource } from '@/types/site';

interface Section {
  source?: 'staff' | 'board';
  showContact?: boolean;
}

interface Person {
  _id: string;
  name?: string;
  title?: string;
  email?: string | null;
  image?: SanityImageSource | null;
  source?: string | null;
  quote?: string | null;
  isAdvisoryBoard?: boolean;
}

const props = defineProps<{ section?: Section | null }>();

const sourceType = computed<'staff' | 'board'>(
  () => props.section?.source || 'staff'
);
const showContact = computed(() => props.section?.showContact !== false);

// useSanity fires once on mount. The two pages (/staff, /board) are separate
// mounts of this component, so a single query per mount is enough.
// `hidden != true` also matches documents with no `hidden` field at all, so
// existing people stay visible without needing a backfill.
const query = `*[_type == $source && hidden != true] | order(name asc){
  _id, name, title, email, image, source, quote, isAdvisoryBoard
}`;

const { data: people, loading } = useSanity<Person[]>(query, {
  source: sourceType.value,
});
</script>

<template>
  <section class="people-grid">
    <div class="people-grid__inner">
      <div v-if="loading" class="people-grid__state">
        <p>Loading…</p>
      </div>

      <div v-else-if="!people?.length" class="people-grid__state">
        <p>No {{ sourceType === 'board' ? 'board members' : 'staff' }} to display yet.</p>
      </div>

      <div v-else class="people-grid__grid">
        <PersonCard
          v-for="person in people"
          :key="person._id"
          :person="person"
          :show-contact="showContact"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.people-grid {
  padding: 2rem 1.5rem 4rem;
  background: var(--color-bg);
}

.people-grid__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.people-grid__state {
  text-align: center;
  color: var(--color-text-muted);
  padding: 3rem 0;
}

.people-grid__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .people-grid__grid {
    gap: 2rem;
  }
}

@media (max-width: 480px) {
  .people-grid__grid {
    grid-template-columns: 1fr;
  }
}
</style>
