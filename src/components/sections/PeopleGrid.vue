<script setup lang="ts">
import { computed } from 'vue';
import PersonCard from '@/components/ui/PersonCard.vue';
import { useSanity } from '@/composables/useSanity';
import { DEPARTMENTS } from '@/lib/departments';
import type { SanityImageSource } from '@/types/site';

interface Section {
  source?: 'staff' | 'board';
  showContact?: boolean;
  groupByDepartment?: boolean;
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
  departments?: string[] | null;
}

const props = defineProps<{ section?: Section | null }>();

const sourceType = computed<'staff' | 'board'>(
  () => props.section?.source || 'staff'
);
const showContact = computed(() => props.section?.showContact !== false);

// Staff are grouped under department headings; board members have no
// departments, so /board keeps the flat grid. Editors can switch grouping off
// per-section without a code change.
const grouped = computed(
  () => sourceType.value === 'staff' && props.section?.groupByDepartment !== false
);

// useSanity fires once on mount. The two pages (/staff, /board) are separate
// mounts of this component, so a single query per mount is enough.
// `hidden != true` also matches documents with no `hidden` field at all, so
// existing people stay visible without needing a backfill.
const query = `*[_type == $source && hidden != true] | order(name asc){
  _id, name, title, email, image, source, quote, isAdvisoryBoard, departments
}`;

const { data: people, loading } = useSanity<Person[]>(query, {
  source: sourceType.value,
});

interface Group {
  key: string;
  label: string;
  people: Person[];
}

// Departments render in the canonical order from @/lib/departments, not
// alphabetically, so the org chart reads the way JC describes it.
//
// Two deliberate omissions:
//  • 'unknown' is an internal triage bucket — "Unknown / Needs Review" must
//    never appear as a public heading — so those people fall through to the
//    trailing group instead.
//  • Empty departments are skipped entirely rather than printing a bare
//    heading over nothing.
//
// Someone assigned to several departments appears under each of them, which is
// what a multi-select implies; the trailing group catches anyone left over.
const groups = computed<Group[]>(() => {
  const list = people.value ?? [];
  if (!grouped.value || !list.length) return [];

  const out: Group[] = [];
  const claimed = new Set<string>();

  for (const dept of DEPARTMENTS) {
    if (dept.value === 'unknown') continue;
    const members = list.filter((p) => p.departments?.includes(dept.value));
    if (!members.length) continue;
    members.forEach((m) => claimed.add(m._id));
    out.push({ key: dept.value, label: dept.label, people: members });
  }

  const rest = list.filter((p) => !claimed.has(p._id));
  if (rest.length) {
    // Only worth a heading of its own when there are real departments above it.
    out.push({ key: '__ungrouped', label: out.length ? 'Additional Staff' : 'Our Staff', people: rest });
  }

  return out;
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

      <!-- Grouped by department (staff) -->
      <template v-else-if="grouped">
        <section
          v-for="group in groups"
          :key="group.key"
          class="people-grid__dept"
        >
          <h2 class="people-grid__dept-title">{{ group.label }}</h2>
          <hr class="people-grid__rule" />
          <div class="people-grid__grid">
            <PersonCard
              v-for="person in group.people"
              :key="`${group.key}-${person._id}`"
              :person="person"
              :show-contact="showContact"
            />
          </div>
        </section>
      </template>

      <!-- Flat grid (board, or grouping switched off) -->
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

.people-grid__dept + .people-grid__dept {
  margin-top: 3.5rem;
}

.people-grid__dept-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0 0 0.75rem;
}

.people-grid__rule {
  border: none;
  border-top: 2px solid var(--jc-gold);
  margin: 0 0 2rem;
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
