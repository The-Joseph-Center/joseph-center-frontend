<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import ProgramDonationsSection from '@/components/sections/ProgramDonationsSection.vue';
import ProgramResourcesSection from '@/components/sections/ProgramResourcesSection.vue';
import SmartLink from '@/components/ui/SmartLink.vue';

interface CardData {
  enabled?: boolean;
  title?: string;
  description?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

interface ProgramDoc {
  title: string;
  slug?: { current: string };
  metaDescription?: string;
  donationsPageEnabled?: boolean;
  donationsSection?: {
    programName?: string;
    sponsorCard?: CardData;
    donateCard?: CardData;
  };
  resourcesSection?: {
    programName?: string;
    learnCard?: CardData;
    resourcesCard?: CardData;
  };
}

const route = useRoute();
const router = useRouter();

const program = ref<ProgramDoc | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// useSanity composable only fetches once on mount; this page needs to refetch
// when route.params.slug changes (same pattern as ProgramPage.vue).
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

const QUERY = `*[_type == "program" && slug.current == $slug][0]{
  title,
  slug,
  metaDescription,
  donationsPageEnabled,
  donationsSection{
    programName,
    sponsorCard{ enabled, title, description, buttonLabel, buttonHref },
    donateCard{ enabled, title, description, buttonLabel, buttonHref }
  },
  resourcesSection{
    programName,
    learnCard{ enabled, title, description, buttonLabel, buttonHref },
    resourcesCard{ enabled, title, description, buttonLabel, buttonHref }
  }
}`;

async function fetchProgram(slug: string) {
  if (!projectId) {
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const url = new URL(
      `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`
    );
    url.searchParams.set('query', QUERY);
    url.searchParams.set('$slug', JSON.stringify(slug));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
    const json = await res.json();
    program.value = json.result as ProgramDoc | null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
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

// Redirect if no program found, or if the donations page is disabled
watch([program, loading], ([val, isLoading]) => {
  if (isLoading) return;
  if (val === null) {
    router.push('/programs');
    return;
  }
  if (val.donationsPageEnabled === false) {
    router.push(`/programs/${route.params.slug}`);
  }
});

watchEffect(() => {
  if (!program.value || program.value.donationsPageEnabled === false) return;
  useHead({
    title: `${program.value.title} Donations — The Joseph Center`,
    meta: [
      {
        name: 'description',
        content:
          program.value.metaDescription ||
          `Support ${program.value.title} at The Joseph Center through event sponsorship or supply donations.`,
      },
    ],
  });
});
</script>

<template>
  <main class="page page--program-donations">
    <div v-if="loading" class="page-loading">
      <p>Loading…</p>
    </div>

    <div v-else-if="error" class="page-error">
      <p>
        Something went wrong loading this page.
        <SmartLink to="/programs">View all programs →</SmartLink>
      </p>
    </div>

    <template v-else-if="program && program.donationsPageEnabled !== false">
      <ProgramDonationsSection
        :program-name="program.donationsSection?.programName || program.title"
        :sponsor-card="program.donationsSection?.sponsorCard"
        :donate-card="program.donationsSection?.donateCard"
      />
      <ProgramResourcesSection
        :program-name="program.resourcesSection?.programName || program.title"
        :learn-card="program.resourcesSection?.learnCard"
        :resources-card="program.resourcesSection?.resourcesCard"
      />
    </template>
  </main>
</template>

<style scoped>
.page-loading,
.page-error {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
}
</style>
