<script setup lang="ts">
import { ref, watch } from 'vue';
import PersonCard from '@/components/ui/PersonCard.vue';
import { departmentForProgramSlug, departmentLabel } from '@/lib/departments';
import type { SanityImageSource } from '@/types/site';

// "Meet the Team" — the staff serving a given program, rendered at the bottom
// of each program page. Staff are matched by the `departments` array on the
// staff document rather than a reference to the program, because several
// departments (IT & Marketing, Maintenance, Security, Operations) have no
// program page to reference. See @/lib/departments for the mapping.
//
// Renders nothing at all when the program has no mapped department or when no
// staff are assigned to it — a program page should never show an empty team
// heading.

interface Person {
  _id: string;
  name?: string;
  title?: string;
  email?: string | null;
  image?: SanityImageSource | null;
  source?: string | null;
  quote?: string | null;
}

const props = defineProps<{ programSlug: string }>();

const people = ref<Person[]>([]);
const loading = ref(true);

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

// `hidden != true` also matches documents with no `hidden` field at all, so
// existing staff stay visible without needing a backfill.
const QUERY = `*[_type == "staff" && $department in departments && hidden != true] | order(name asc){
  _id, name, title, email, image, source, quote
}`;

// The department this section is showing, or null when the program has none.
const department = ref<string | null>(null);

async function fetchStaff(slug: string) {
  const dept = departmentForProgramSlug(slug);
  department.value = dept;

  if (!dept || !projectId) {
    people.value = [];
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const url = new URL(
      `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`
    );
    url.searchParams.set('query', QUERY);
    url.searchParams.set('$department', JSON.stringify(dept));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
    const json = await res.json();
    people.value = (json.result as Person[]) ?? [];
  } catch {
    // A failed team lookup shouldn't break the program page — just hide the
    // section, same as having no staff assigned.
    people.value = [];
  } finally {
    loading.value = false;
  }
}

watch(() => props.programSlug, (slug) => { if (slug) fetchStaff(slug); }, { immediate: true });
</script>

<template>
  <section v-if="!loading && department && people.length" class="program-staff">
    <div class="program-staff__inner">
      <h2 class="program-staff__heading">Meet the Team</h2>
      <p class="program-staff__intro">
        The people behind {{ departmentLabel(department) }}.
      </p>

      <div class="program-staff__grid">
        <PersonCard
          v-for="person in people"
          :key="person._id"
          :person="person"
          :show-contact="true"
        />
      </div>

      <p class="program-staff__all">
        <a href="/staff">Meet our full staff →</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.program-staff {
  padding: 4rem 1.5rem;
  background: var(--color-bg-secondary, var(--color-bg));
  border-top: 1px solid var(--color-border);
}

.program-staff__inner {
  max-width: 1200px;
  margin: 0 auto;
}

.program-staff__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
  text-align: center;
}

.program-staff__intro {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  margin: 0 0 2.5rem;
  text-align: center;
}

.program-staff__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.program-staff__all {
  margin: 2.5rem 0 0;
  text-align: center;
  font-size: var(--text-sm);
}
.program-staff__all a {
  color: var(--jc-deep-green);
  font-weight: 600;
}

@media (max-width: 480px) {
  .program-staff {
    padding: 3rem 1.25rem;
  }
  .program-staff__grid {
    grid-template-columns: 1fr;
  }
}
</style>
