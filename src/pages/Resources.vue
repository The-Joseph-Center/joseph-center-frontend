<script setup lang="ts">
import { computed, ref } from 'vue';
import { useHead } from '@unhead/vue';
import { useSanity } from '@/composables/useSanity';
import { RESOURCE_CATEGORIES } from '@/lib/resourceCategories';

useHead({
  title: 'Resources — The Joseph Center',
  meta: [{
    name: 'description',
    content: 'Community resources for housing, food, legal aid, medical support, employment, and more in the Grand Valley.',
  }],
});

interface Resource {
  _id: string;
  title: string;
  url: string;
  description?: string | null;
  category: string;
  phone?: string | null;
  address?: string | null;
  featured?: boolean;
  programs?: string[];
}

const query = `*[_type == "resource" && active != false] | order(featured desc, title asc) {
  _id, title, url, description, category, phone, address, featured, programs
}`;

const { data: resources, loading } = useSanity<Resource[]>(query);

const activeCategory = ref<string | null>(null);

const grouped = computed(() => {
  const list = resources.value ?? [];
  const items = activeCategory.value
    ? list.filter((r) => r.category === activeCategory.value)
    : list;

  const groups: Record<string, Resource[]> = {};
  for (const r of items) {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category]!.push(r);
  }

  // Preserve the canonical category order (RESOURCE_CATEGORIES), filtering
  // out categories with no resources.
  return RESOURCE_CATEGORIES
    .filter((cat) => groups[cat.value]?.length)
    .map((cat) => ({
      category: cat.value,
      label: cat.label,
      items: groups[cat.value]!,
    }));
});

const availableCategories = computed(() => {
  const list = resources.value ?? [];
  const used = new Set(list.map((r) => r.category));
  return RESOURCE_CATEGORIES.filter((c) => used.has(c.value));
});
</script>

<template>
  <main class="page page--resources">
    <div class="form-banner">
      <h1 class="form-banner__title">Resources</h1>
    </div>

    <div class="resources-page__body">
      <p class="resources-page__intro">
        A collection of community resources available to guests and families in
        the Grand Valley. For help finding the right resource, contact The
        Joseph Center at <a href="tel:+19702457672">(970) 245-7672</a>.
      </p>

      <div v-if="!loading && availableCategories.length" class="resources-page__filters">
        <button
          type="button"
          class="resources-page__filter"
          :class="{ 'resources-page__filter--active': activeCategory === null }"
          @click="activeCategory = null"
        >
          All
        </button>
        <button
          v-for="cat in availableCategories"
          :key="cat.value"
          type="button"
          class="resources-page__filter"
          :class="{ 'resources-page__filter--active': activeCategory === cat.value }"
          @click="activeCategory = cat.value"
        >
          {{ cat.label }}
        </button>
      </div>

      <div v-if="loading" class="resources-page__state">
        <p>Loading resources…</p>
      </div>

      <div v-else-if="!grouped.length" class="resources-page__state">
        <p v-if="activeCategory">No resources in this category yet.</p>
        <p v-else>No resources have been added yet. Check back soon.</p>
      </div>

      <div v-else class="resources-page__groups">
        <section
          v-for="group in grouped"
          :key="group.category"
          class="resources-page__group"
        >
          <h2 class="resources-page__group-heading">{{ group.label }}</h2>
          <ul class="resources-page__list">
            <li
              v-for="resource in group.items"
              :key="resource._id"
              class="resources-page__item"
            >
              <a
                :href="resource.url"
                target="_blank"
                rel="noopener noreferrer"
                class="resources-page__item-title"
              >
                {{ resource.title }}
                <span
                  v-if="resource.featured"
                  class="resources-page__featured-badge"
                  aria-label="Featured resource"
                >★</span>
              </a>
              <p v-if="resource.description" class="resources-page__item-desc">
                {{ resource.description }}
              </p>
              <div
                v-if="resource.phone || resource.address"
                class="resources-page__item-contact"
              >
                <a v-if="resource.phone" :href="`tel:${resource.phone.replace(/\D/g, '')}`">
                  {{ resource.phone }}
                </a>
                <span v-if="resource.address">{{ resource.address }}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.form-banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}
.form-banner__title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.resources-page__body {
  max-width: 780px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

.resources-page__intro {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0 0 2rem;
}
.resources-page__intro a {
  color: var(--jc-deep-green);
  font-weight: 600;
}

/* Category filter pills */
.resources-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2.5rem;
}

.resources-page__filter {
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  border: 1px solid var(--color-border, #e0d8c5);
  background: white;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}
.resources-page__filter:hover {
  border-color: var(--jc-deep-green);
  color: var(--color-text);
}
.resources-page__filter--active {
  background: var(--jc-deep-green);
  border-color: var(--jc-deep-green);
  color: white;
}

.resources-page__state {
  text-align: center;
  padding: 3rem 0;
  color: var(--color-text-muted);
}

.resources-page__groups {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.resources-page__group-heading {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--jc-gold);
  margin: 0 0 1rem;
}

.resources-page__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.resources-page__item {
  padding: 0;
}

.resources-page__item-title {
  display: inline-block;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--jc-deep-green);
  text-decoration: none;
  margin-bottom: 0.25rem;
}
.resources-page__item-title:hover { text-decoration: underline; }

.resources-page__featured-badge {
  color: var(--jc-gold);
  margin-left: 0.375rem;
  font-size: var(--text-sm);
}

.resources-page__item-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0 0 0.25rem;
}

.resources-page__item-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.resources-page__item-contact a {
  color: var(--color-text-muted);
  text-decoration: none;
}
.resources-page__item-contact a:hover {
  color: var(--jc-deep-green);
  text-decoration: underline;
}
</style>
