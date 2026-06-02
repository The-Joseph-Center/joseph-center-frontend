<script setup lang="ts">
import { ref, watch, watchEffect, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { PortableText } from '@portabletext/vue';
import type { TypedObject } from '@portabletext/types';
import HeroSection from '@/components/sections/HeroSection.vue';
import SmartLink from '@/components/ui/SmartLink.vue';
import { sanityImage } from '@/composables/useSanityImage';
import type { SanityImageSource } from '@/types/site';

interface Sponsor {
  _key: string;
  name?: string;
  website?: string;
  logo?: SanityImageSource;
}

interface EventDoc {
  title: string;
  slug?: { current: string };
  date?: string | null;
  image?: SanityImageSource | null;
  alt?: string | null;
  description?: TypedObject[] | null;
  location?: TypedObject[] | null;
  invitation?: TypedObject[] | null;
  sponsors?: Sponsor[] | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

const route = useRoute();
const router = useRouter();

const event = ref<EventDoc | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// useSanity fires once on mount; this page needs to refetch when the slug
// changes (same pattern as ProgramPage.vue).
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

const QUERY = `*[_type == "events" && slug.current == $slug][0]{
  title,
  slug,
  date,
  image,
  alt,
  description,
  location,
  invitation,
  sponsors[]{
    _key,
    name,
    website,
    logo
  },
  ctaLabel,
  ctaHref
}`;

async function fetchEvent(slug: string) {
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
    event.value = json.result as EventDoc | null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    if (typeof slug === 'string') fetchEvent(slug);
  },
  { immediate: true }
);

watch([event, loading], ([val, isLoading]) => {
  if (!isLoading && val === null) router.push('/events');
});

watchEffect(() => {
  if (!event.value) return;
  const dateStr = event.value.date
    ? new Date(event.value.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  useHead({
    title: `${event.value.title} — The Joseph Center`,
    meta: [
      {
        name: 'description',
        content: `${event.value.title} at The Joseph Center in Grand Junction, CO.${dateStr ? ` ${dateStr}.` : ''}`,
      },
    ],
  });
});

const formattedDate = computed(() => {
  if (!event.value?.date) return null;
  const d = new Date(event.value.date);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
});

const externalCta = computed(() => {
  const href = event.value?.ctaHref;
  return href ? /^https?:\/\//i.test(href) : false;
});

function sponsorLogoUrl(sponsor: Sponsor): string | null {
  if (!sponsor.logo) return null;
  try {
    return sanityImage(sponsor.logo).width(200).height(120).fit('max').auto('format').url();
  } catch {
    return null;
  }
}
</script>

<template>
  <main class="page page--event-detail">
    <div v-if="loading" class="event-state">
      <p>Loading…</p>
    </div>

    <div v-else-if="error" class="event-state">
      <p>
        Something went wrong loading this event.
        <SmartLink to="/events">View all events →</SmartLink>
      </p>
    </div>

    <template v-else-if="event">
      <HeroSection
        :section="{
          title: event.title,
          image: event.image,
          imageAlt: event.alt || event.title,
          align: 'right',
          minHeight: '50vh',
          showStripe: true,
          stripeColor: 'gold',
        }"
      />

      <section class="event-detail">
        <div class="event-detail__inner">
          <p v-if="formattedDate" class="event-detail__date">
            <time :datetime="event.date || undefined">{{ formattedDate }}</time>
          </p>

          <div v-if="event.description" class="event-detail__description prose">
            <PortableText :value="event.description" />
          </div>

          <div v-if="event.location" class="event-detail__location">
            <h2 class="event-detail__h">Location</h2>
            <div class="prose"><PortableText :value="event.location" /></div>
          </div>

          <div v-if="event.invitation" class="event-detail__invitation">
            <h2 class="event-detail__h">You're Invited</h2>
            <div class="prose"><PortableText :value="event.invitation" /></div>
          </div>

          <div v-if="event.ctaHref && event.ctaLabel" class="event-detail__cta-wrap">
            <SmartLink
              :to="event.ctaHref"
              :target="externalCta ? '_blank' : undefined"
              :rel="externalCta ? 'noopener noreferrer' : undefined"
              class="btn-primary event-detail__cta"
            >
              {{ event.ctaLabel }}
            </SmartLink>
          </div>

          <div v-if="event.sponsors?.length" class="event-detail__sponsors">
            <h2 class="event-detail__h">Sponsors</h2>
            <div class="event-detail__sponsors-grid">
              <component
                :is="sponsor.website ? 'a' : 'div'"
                v-for="sponsor in event.sponsors"
                :key="sponsor._key"
                :href="sponsor.website || undefined"
                :target="sponsor.website ? '_blank' : undefined"
                :rel="sponsor.website ? 'noopener noreferrer' : undefined"
                class="event-detail__sponsor"
              >
                <img
                  v-if="sponsorLogoUrl(sponsor)"
                  :src="sponsorLogoUrl(sponsor)!"
                  :alt="sponsor.name || 'Sponsor logo'"
                  loading="lazy"
                />
                <span v-else>{{ sponsor.name || 'Sponsor' }}</span>
              </component>
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.event-state {
  max-width: 900px;
  margin: 0 auto;
  padding: 8rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
}

.event-detail {
  padding: 3rem 1.5rem 4rem;
  background: var(--color-bg);
}

.event-detail__inner {
  max-width: 780px;
  margin: 0 auto;
}

.event-detail__date {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--jc-deep-green);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 1.5rem;
}

.event-detail__h {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 2.5rem 0 0.75rem;
}

.prose :deep(p) {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.75;
  margin: 0 0 1rem;
}

.event-detail__cta-wrap {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-start;
}

.event-detail__sponsors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.5rem;
  align-items: center;
  margin-top: 1rem;
}

.event-detail__sponsor {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: var(--radius-card, 0.5rem);
  background: white;
  border: 1px solid var(--color-border, #e0d8c5);
  transition: transform 150ms ease, box-shadow 150ms ease;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
  text-align: center;
}

a.event-detail__sponsor:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.08));
}

.event-detail__sponsor img {
  max-width: 100%;
  height: auto;
  max-height: 80px;
  object-fit: contain;
}
</style>
