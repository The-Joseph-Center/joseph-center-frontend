<script setup lang="ts">
import { computed, ref } from 'vue';
import EventCard from '@/components/ui/EventCard.vue';
import { useSanity } from '@/composables/useSanity';
import type { TypedObject } from '@portabletext/types';

interface Section {
  bannerText?: string;
  // When true, the "Past Events" section starts expanded instead of collapsed.
  // Default (false / unset) hides past events behind a toggle button.
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

// Production _type is lowercase plural `events`. Fetch the full set —
// upcoming/past split happens client-side.
const query = `*[_type == "events"] | order(featured desc, coalesce(date, "9999-12-31") asc){
  _id, title, slug, date, description, ctaLabel, ctaHref, featured
}`;

const { data: allEvents, loading } = useSanity<EventDoc[]>(query);

const bannerText = computed(
  () => props.section?.bannerText || 'Join Us at an Upcoming Event'
);

// Upcoming: event has no date set OR date is today/future.
const upcomingEvents = computed(() => {
  if (!allEvents.value) return [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return allEvents.value.filter((e) => {
    if (!e.date) return true;
    const t = new Date(e.date).getTime();
    return Number.isNaN(t) || t >= now.getTime();
  });
});

// Past: event has a date set and the date is before today. Sorted
// newest-past first (most recent past event at the top).
const pastEvents = computed(() => {
  if (!allEvents.value) return [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return allEvents.value
    .filter((e) => e.date && new Date(e.date).getTime() < now.getTime())
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
});

// Section-level Sanity toggle controls the default expansion state of the
// past-events panel; the user can still flip it via the button.
const showPastEvents = ref<boolean>(props.section?.showPastEvents === true);
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

      <template v-else>
        <!-- Upcoming events (or fallback empty state) -->
        <template v-if="upcomingEvents.length">
          <EventCard
            v-for="event in upcomingEvents"
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
          <p v-if="pastEvents.length" class="events-list__empty-hint">
            See past events below.
          </p>
        </div>

        <!-- Past Events — collapsed by default. Section-level
             showPastEvents flag from Sanity controls the initial state. -->
        <div v-if="pastEvents.length" class="events-list__past">
          <button
            type="button"
            class="events-list__past-toggle"
            :aria-expanded="showPastEvents"
            @click="showPastEvents = !showPastEvents"
          >
            <span>Past Events ({{ pastEvents.length }})</span>
            <span
              class="events-list__past-toggle-icon"
              :class="{ 'events-list__past-toggle-icon--open': showPastEvents }"
              aria-hidden="true"
            >▾</span>
          </button>

          <Transition name="events-collapse">
            <div v-if="showPastEvents" class="events-list__past-list">
              <EventCard
                v-for="event in pastEvents"
                :key="event._id"
                :title="event.title"
                :description="event.description"
                :date="event.date"
                :cta-label="event.ctaLabel"
                :cta-href="event.ctaHref"
                :detail-slug="event.slug?.current"
                class="events-list__past-card"
              />
            </div>
          </Transition>
        </div>
      </template>
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

.events-list__empty-hint {
  font-size: var(--text-sm);
  margin-top: 0.5rem;
}

/* Past Events block */
.events-list__past {
  margin-top: 2.5rem;
  border-top: 1px solid var(--color-border, #e0d8c5);
  padding-top: 1.5rem;
}

.events-list__past-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  padding: 0.5rem 0;
  cursor: pointer;
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-muted);
  text-align: left;
}
.events-list__past-toggle:hover { color: var(--color-text); }

.events-list__past-toggle-icon {
  font-size: var(--text-xl);
  transition: transform 200ms ease;
  display: inline-block;
}
.events-list__past-toggle-icon--open { transform: rotate(180deg); }

.events-list__past-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transform-origin: top;
}

.events-list__past-card {
  opacity: 0.75;
  transition: opacity 200ms ease;
}
.events-list__past-card:hover { opacity: 1; }

.events-collapse-enter-active,
.events-collapse-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
  transform-origin: top;
}
.events-collapse-enter-from,
.events-collapse-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .events-list__past-toggle-icon,
  .events-list__past-card,
  .events-collapse-enter-active,
  .events-collapse-leave-active {
    transition: none;
  }
}
</style>
