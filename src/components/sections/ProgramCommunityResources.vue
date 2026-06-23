<script setup lang="ts">
import { computed } from 'vue';
import { useSanity } from '@/composables/useSanity';
import { RESOURCE_CATEGORIES } from '@/lib/resourceCategories';
import SmartLink from '@/components/ui/SmartLink.vue';

// Program-scoped resources block. Mounted on ProgramPage.vue and filtered
// by the current program's slug. A resource shows up here if its
// `programs` array includes the program slug OR includes 'all'.
//
// Rendering nothing when the query returns empty keeps program pages clean
// for programs that don't have any associated resources yet.
//
// Parent should pass `:key="programSlug"` so this section re-mounts (and
// re-fetches) when the user navigates between program pages.

const props = defineProps<{
  programSlug: string;
}>();

interface Resource {
  _id: string;
  title: string;
  url: string;
  description?: string | null;
  category: string;
  phone?: string | null;
  featured?: boolean;
}

const query = `*[_type == "resource" && active != false && ($slug in programs || "all" in programs)] | order(featured desc, category asc, title asc) {
  _id, title, url, description, category, phone, featured
}`;

const { data: resources, loading } = useSanity<Resource[]>(query, { slug: props.programSlug });

const grouped = computed(() => {
  const list = resources.value ?? [];
  if (!list.length) return [];
  const groups: Record<string, Resource[]> = {};
  for (const r of list) {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category]!.push(r);
  }
  return RESOURCE_CATEGORIES
    .filter((cat) => groups[cat.value]?.length)
    .map((cat) => ({ category: cat.value, label: cat.label, items: groups[cat.value]! }));
});
</script>

<template>
  <section
    v-if="!loading && grouped.length"
    class="program-community-resources"
  >
    <div class="program-community-resources__inner">
      <h2 class="program-community-resources__heading">Resources</h2>
      <p class="program-community-resources__intro">
        Community resources that may be helpful for people connected to this program.
        <SmartLink to="/resources">View all resources →</SmartLink>
      </p>

      <div
        v-for="group in grouped"
        :key="group.category"
        class="program-community-resources__group"
      >
        <h3 class="program-community-resources__group-label">{{ group.label }}</h3>
        <ul class="program-community-resources__list">
          <li
            v-for="resource in group.items"
            :key="resource._id"
            class="program-community-resources__item"
          >
            <a
              :href="resource.url"
              target="_blank"
              rel="noopener noreferrer"
              class="program-community-resources__link"
            >
              {{ resource.title }}
            </a>
            <span
              v-if="resource.description"
              class="program-community-resources__desc"
            >
              — {{ resource.description }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.program-community-resources {
  padding: 2.5rem 1.5rem 3.5rem;
  background: var(--color-bg-secondary, var(--color-bg));
  border-top: 1px solid var(--color-border);
}

.program-community-resources__inner {
  max-width: 780px;
  margin: 0 auto;
}

.program-community-resources__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.program-community-resources__intro {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 2rem;
}
.program-community-resources__intro a {
  color: var(--jc-deep-green);
  font-weight: 600;
  margin-left: 0.25rem;
}

.program-community-resources__group {
  margin-bottom: 1.5rem;
}
.program-community-resources__group:last-child {
  margin-bottom: 0;
}

.program-community-resources__group-label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0 0 0.5rem;
}

.program-community-resources__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.program-community-resources__link {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--jc-deep-green);
  text-decoration: none;
}
.program-community-resources__link:hover { text-decoration: underline; }

.program-community-resources__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-left: 0.25rem;
}
</style>
