<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import { PortableText } from '@portabletext/vue';
import type { TypedObject } from '@portabletext/types';

interface LegalDoc {
  title?: string;
  lastUpdated?: string;
  body?: TypedObject[] | null;
}

// Slug is derived from the current route path (e.g. /privacy-policy), so a
// single component instance handles every legal route without per-route props.
const route = useRoute();

const page = ref<LegalDoc | null>(null);
const loading = ref(true);

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

const QUERY = `*[_type == "legalPage" && slug.current == $slug][0]{ title, lastUpdated, body }`;

async function fetchPage(slug: string) {
  if (!projectId) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const url = new URL(
      `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`
    );
    url.searchParams.set('query', QUERY);
    url.searchParams.set('$slug', JSON.stringify(slug));
    const res = await fetch(url.toString());
    const json = await res.json();
    page.value = (json.result as LegalDoc) || null;
  } catch (err) {
    console.error('Failed to fetch legal page:', err);
    page.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.path,
  (path) => fetchPage(path),
  { immediate: true }
);

watch(page, (val) => {
  if (val?.title) {
    useHead({
      title: `${val.title} — The Joseph Center`,
    });
  }
});

function formattedDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<template>
  <main class="page page--legal">
    <div class="legal-wrap">
      <div v-if="loading" class="legal-state">
        <p>Loading…</p>
      </div>

      <template v-else-if="page">
        <h1 class="legal-title">{{ page.title }}</h1>
        <p v-if="page.lastUpdated" class="legal-updated">
          <strong>Last updated:</strong> {{ formattedDate(page.lastUpdated) }}
        </p>
        <div v-if="page.body" class="legal-content prose">
          <PortableText :value="page.body" />
        </div>
      </template>

      <template v-else>
        <h1 class="legal-title">Content not available</h1>
        <p class="legal-state">
          This page has not been set up yet. Please add content in the CMS.
        </p>
      </template>
    </div>
  </main>
</template>

<style scoped>
.legal-wrap {
  max-width: 780px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.legal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.legal-updated {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 2rem;
}

.legal-content :deep(h2) {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 2rem 0 0.75rem;
}

.legal-content :deep(h3) {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 1.5rem 0 0.5rem;
}

.legal-content :deep(p) {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.75;
  margin: 0 0 1rem;
}

.legal-content :deep(ul) {
  padding-left: 1.5rem;
  margin: 0 0 1rem;
}

.legal-content :deep(li) {
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.7;
  margin-bottom: 0.25rem;
}

.legal-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--color-text-muted);
}
</style>
