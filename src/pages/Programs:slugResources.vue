<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import ProgramCommunityResources from '@/components/sections/ProgramCommunityResources.vue';

// Program sub-page that surfaces community resources scoped to a single
// program. Replaces the old /donations sub-page — per the 06/16/26 review,
// program-specific giving was dropped (all donations route through the
// general /donate page), so the slug surface is repurposed for resources.

interface ProgramDoc {
  title: string;
  slug?: { current: string };
  metaDescription?: string;
}

const route = useRoute();
const router = useRouter();

const program = ref<ProgramDoc | null>(null);
const loading = ref(true);

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

const QUERY = `*[_type == "program" && slug.current == $slug][0]{
  title, slug, metaDescription
}`;

async function fetchProgram(slug: string) {
  if (!projectId) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`);
    url.searchParams.set('query', QUERY);
    url.searchParams.set('$slug', JSON.stringify(slug));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
    const json = await res.json();
    program.value = json.result as ProgramDoc | null;
  } catch {
    program.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    if (typeof slug === 'string') fetchProgram(slug);
  },
  { immediate: true }
);

// Redirect to programs hub if the slug doesn't resolve.
watch([program, loading], ([val, isLoading]) => {
  if (!isLoading && val === null) router.push('/programs');
});

watchEffect(() => {
  if (!program.value) return;
  useHead({
    title: `${program.value.title} Resources — The Joseph Center`,
    meta: [{
      name: 'description',
      content:
        program.value.metaDescription ||
        `Community resources for people connected to the ${program.value.title} program at The Joseph Center.`,
    }],
  });
});
</script>

<template>
  <main class="page page--program-resources">
    <div v-if="loading" class="state">
      <p>Loading…</p>
    </div>

    <template v-else-if="program">
      <div class="form-banner">
        <h1 class="form-banner__title">{{ program.title }} — Resources</h1>
      </div>

      <ProgramCommunityResources
        v-if="program.slug?.current"
        :key="program.slug.current"
        :program-slug="program.slug.current"
      />
    </template>
  </main>
</template>

<style scoped>
.state {
  text-align: center;
  padding: 4rem 0;
  color: var(--color-text-muted);
}
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
</style>
