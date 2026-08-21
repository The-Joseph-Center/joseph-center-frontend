<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { PortableText } from '@portabletext/vue';
import type { TypedObject } from '@portabletext/types';
import HeroSection from '@/components/sections/HeroSection.vue';
import HowYouCanHelp from '@/components/sections/HowYouCanHelp.vue';
import ProgramTestimonialsSection from '@/components/sections/ProgramTestimonialsSection.vue';
import CampaignProgressBar from '@/components/donate/CampaignProgressBar.vue';
import ProgramCommunityResources from '@/components/sections/ProgramCommunityResources.vue';
import ProgramStaffSection from '@/components/sections/ProgramStaffSection.vue';
import SmartLink from '@/components/ui/SmartLink.vue';
import type { SanityImageSource } from '@/types/site';

interface InlineCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface ProgramVideo {
  title: string;
  link: string;
}

interface ProgramDoc {
  _id?: string;
  title: string;
  slug?: { current: string };
  metaDescription?: string;
  heroImage?: SanityImageSource & { alt?: string };
  visionHeading?: string;
  visionBody?: string;
  howWeHelpContent?: TypedObject[];
  inlineCtas?: InlineCta[];
  donorAppealEnabled?: boolean;
  personDescriptor?: string;
  programVideos?: ProgramVideo[];
  programVideosIntro?: string;
  donorIntro?: string;
  donorAsk?: number;
  donorCta1Label?: string;
  donorCta1Href?: string;
  donorCta2Label?: string;
  donorCta2Href?: string;
}

const route = useRoute();
const router = useRouter();

const program = ref<ProgramDoc | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// useSanity composable only fetches once on mount; ProgramPage needs to refetch
// when route.params.slug changes (Vue Router reuses the same component for
// /programs/:slug → /programs/:other-slug). Inline a fetch + watcher.
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

const QUERY = `*[_type == "program" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  metaDescription,
  heroImage,
  visionHeading,
  visionBody,
  howWeHelpContent,
  inlineCtas[]{ label, href, variant },
  donorAppealEnabled,
  personDescriptor,
  programVideos[]{ title, link },
  programVideosIntro,
  donorIntro,
  donorAsk,
  donorCta1Label,
  donorCta1Href,
  donorCta2Label,
  donorCta2Href
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

// Redirect to /programs hub if the slug doesn't resolve to a document
watch([program, loading], ([val, isLoading]) => {
  if (!isLoading && val === null) router.push('/programs');
});

// ── Active campaigns scoped to this program ──
interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  goal_cents: number | null;
  raised_cents: number | null;
  end_date: string | null;
  show_progress: boolean;
}
const campaigns = ref<Campaign[]>([]);

watch(
  () => program.value?._id,
  async (programId) => {
    if (!programId) {
      campaigns.value = [];
      return;
    }
    try {
      const res = await fetch(
        `/.netlify/functions/list-active-campaigns?programId=${encodeURIComponent(programId)}`
      );
      if (!res.ok) {
        campaigns.value = [];
        return;
      }
      const data = (await res.json()) as { campaigns: Campaign[] };
      campaigns.value = data.campaigns ?? [];
    } catch {
      campaigns.value = [];
    }
  }
);

// SEO — runs whenever the program (re)loads
watchEffect(() => {
  if (!program.value) return;
  useHead({
    title: `${program.value.title} — The Joseph Center`,
    meta: [
      {
        name: 'description',
        content:
          program.value.metaDescription ||
          `${program.value.title} at The Joseph Center in Grand Junction, CO.`,
      },
    ],
  });
});

function ctaClass(variant?: InlineCta['variant']) {
  switch (variant) {
    case 'secondary': return 'btn-secondary';
    case 'ghost':     return 'btn-ghost';
    case 'primary':
    default:          return 'btn-primary';
  }
}
</script>

<template>
  <main class="page page--program">
    <div v-if="loading" class="program-loading">
      <p>Loading…</p>
    </div>

    <div v-else-if="error" class="program-error">
      <p>
        Something went wrong loading this program.
        <SmartLink to="/programs">View all programs →</SmartLink>
      </p>
    </div>

    <template v-else-if="program">
      <!-- 1. Hero — pass through as a section-shaped object -->
      <HeroSection
        :section="{
          title: program.title,
          image: program.heroImage,
          imageAlt: program.heroImage?.alt || program.title,
          align: 'right',
          minHeight: '60vh',
          showStripe: true,
          stripeColor: 'gold',
        }"
      />

      <!-- 2. Vision -->
      <section class="program-vision">
        <div class="program-vision__inner">
          <h2 class="program-vision__heading">
            {{ program.visionHeading || 'Our Vision' }}
          </h2>
          <p v-if="program.visionBody" class="program-vision__body">
            {{ program.visionBody }}
          </p>
        </div>
      </section>

      <!-- 3. How We Help -->
      <section class="program-help">
        <div class="program-help__inner">
          <h2 class="program-help__heading">How We Help</h2>

          <div v-if="program.howWeHelpContent" class="program-help__content prose">
            <PortableText :value="program.howWeHelpContent" />
          </div>

          <div v-if="program.inlineCtas?.length" class="program-help__ctas">
            <SmartLink
              v-for="cta in program.inlineCtas"
              :key="cta.label"
              :to="cta.href"
              :class="ctaClass(cta.variant)"
            >
              {{ cta.label }}
            </SmartLink>
          </div>
        </div>
      </section>

      <!-- 4. Their Words — only renders when program.programVideos has entries -->
      <ProgramTestimonialsSection
        v-if="program.programVideos?.length"
        :videos="program.programVideos"
        :intro="program.programVideosIntro"
        :layout="program.programVideos.length === 1 ? 'single' : 'grid'"
      />

      <!-- 5. Active campaigns scoped to this program (renders nothing when none active) -->
      <section v-if="campaigns.length > 0" class="program-campaigns">
        <div class="program-campaigns__inner">
          <a
            v-for="c in campaigns"
            :key="c.id"
            :href="`/donate?campaign=${c.slug}`"
            class="program-campaigns__card-link"
          >
            <CampaignProgressBar
              :name="c.name"
              :description="c.description"
              :goal-cents="c.goal_cents"
              :raised-cents="c.raised_cents"
              :end-date="c.end_date"
              :show-progress="c.show_progress"
            />
          </a>
        </div>
      </section>

      <!-- 6. How You Can Help (donor appeal) -->
      <HowYouCanHelp
        v-if="program.donorAppealEnabled !== false"
        :person-descriptor="program.personDescriptor"
        :donor-intro="program.donorIntro"
        :donor-ask="program.donorAsk"
        :cta1-label="program.donorCta1Label"
        :cta1-href="program.donorCta1Href"
        :cta2-label="program.donorCta2Label"
        :cta2-href="program.donorCta2Href"
      />

      <!-- 7. Community resources filtered to this program. Keyed by slug so
           the section re-mounts (and re-fetches) when navigating between
           program pages. Auto-hides when no matching resources exist. -->
      <ProgramCommunityResources
        v-if="program.slug?.current"
        :key="program.slug.current"
        :program-slug="program.slug.current"
      />

      <!-- 8. Meet the Team — staff whose department maps to this program.
           Renders nothing for programs with no mapped department or no
           assigned staff. -->
      <ProgramStaffSection
        v-if="program.slug?.current"
        :program-slug="program.slug.current"
      />
    </template>
  </main>
</template>

<style scoped>
.program-loading,
.program-error {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
}

/* Active campaigns scoped to this program */
.program-campaigns {
  padding: 0 1.5rem 1.5rem;
  background: var(--color-bg);
}
.program-campaigns__inner {
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.program-campaigns__card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 200ms ease;
}
.program-campaigns__card-link:hover {
  transform: translateY(-2px);
}

/* Vision */
.program-vision {
  padding: 3.5rem 1.5rem 2rem;
  background: var(--color-bg);
}

.program-vision__inner {
  max-width: 780px;
  margin: 0 auto;
}

.program-vision__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem;
}

.program-vision__body {
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0;
}

/* How We Help */
.program-help {
  padding: 2rem 1.5rem 3.5rem;
  background: var(--color-bg);
}

.program-help__inner {
  max-width: 780px;
  margin: 0 auto;
}

.program-help__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1.5rem;
}

.program-help__content :deep(p) {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.75;
  margin: 0 0 1rem;
}

.program-help__content :deep(h3) {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 2rem 0 0.75rem;
}

.program-help__content :deep(h4) {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 1.5rem 0 0.5rem;
}

.program-help__content :deep(ul) {
  list-style: disc outside;
  padding-left: 1.5rem;
  margin: 0 0 1rem;
}

.program-help__content :deep(ol) {
  list-style: decimal outside;
  padding-left: 1.5rem;
  margin: 0 0 1rem;
}

.program-help__content :deep(li) {
  display: list-item;
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.75;
  margin-bottom: 0.25rem;
}

.program-help__content :deep(li::marker) {
  color: var(--color-text-muted);
}

.program-help__ctas {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2.5rem;
}

@media (max-width: 480px) {
  .program-help__ctas { flex-direction: column; }
  .program-help__ctas a { text-align: center; }
}
</style>
