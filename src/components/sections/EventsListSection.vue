<script setup lang="ts">
import { computed } from 'vue';
import EventCard from '@/components/ui/EventCard.vue';
import { useSanity } from '@/composables/useSanity';
import type { TypedObject } from '@portabletext/types';

interface Section {
  bannerText?: string;
  showPastEvents?: boolean;
}

interface EventDoc {
  _id: string;
  title: string;
  slug?: { current: string };
  date?: string | null;
  description?: TypedObject[] | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  featured?: boolean | null;
}

const props = defineProps<{ section?: Section | null }>();

// Production _type is lowercase plural `events`. Sort featured first, then by
// date ascending. Undated events fall to the end via coalesce(date, far-future).
const query = `*[_type == "events"] | order(featured desc, coalesce(date, "9999-12-31") asc){
  _id, title, slug, date, description, ctaLabel, ctaHref, featured
}`;

const { data: allEvents, loading } = useSanity<EventDoc[]>(query);

const bannerText = computed(
  () => props.section?.bannerText || 'Join Us at an Upcoming Event'
);

const events = computed(() => {
  if (!allEvents.value) return [];
  if (props.section?.showPastEvents) return allEvents.value;
  const now = Date.now();
  return allEvents.value.filter((e) => {
    if (!e.date) return true; // undated events always show
    const t = new Date(e.date).getTime();
    return Number.isNaN(t) || t >= now;
  });
});
</script>

<template>
  <section class="events-list">
    <div class="events-list__banner">
      <h2 class="events-list__banner-text">{{ bannerText }}</h2>
    </div>

    <div class="events-list__inner">
      <div v-if="loading" class="events-list__state">
        <p>Loading events…</p>
      </div>

      <template v-else-if="events.length">
        <EventCard
          v-for="event in events"
          :key="event._id"
          :title="event.title"
          :description="event.description"
          :date="event.date"
          :cta-label="event.ctaLabel"
          :cta-href="event.ctaHref"
          :detail-slug="event.slug?.current"
        />
      </template>

      <div v-else class="events-list__empty">
        <p>No upcoming events right now. Check back soon!</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.events-list__banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}

.events-list__banner-text {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.events-list__inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
}

.events-list__state,
.events-list__empty {
  text-align: center;
  padding: 3rem 0;
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
