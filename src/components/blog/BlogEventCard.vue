<script setup lang="ts">
import SmartLink from '@/components/ui/SmartLink.vue';

defineProps<{
  event: {
    _id: string;
    title: string;
    slug: { current: string };
    date?: string | null;
    description?: string | null;
    image?: { asset?: { url?: string }; alt?: string | null } | null;
  };
}>();

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
</script>

<template>
  <article class="blog-event-card">
    <SmartLink :to="`/events/${event.slug.current}`" class="blog-event-card__link">
      <div class="blog-event-card__body">
        <div class="blog-event-card__meta">
          <span class="blog-event-card__type">Event</span>
          <time v-if="event.date" class="blog-event-card__date">
            {{ formatDate(event.date) }}
          </time>
        </div>
        <h2 class="blog-event-card__title">{{ event.title }}</h2>
        <p v-if="event.description" class="blog-event-card__desc">
          {{ event.description }}
        </p>
        <span class="blog-event-card__more">Event details →</span>
      </div>
    </SmartLink>
  </article>
</template>

<style scoped>
.blog-event-card {
  border: 1px solid var(--color-border, #e0d8c5);
  border-left: 4px solid var(--jc-green, #60b567);
  border-radius: var(--radius-card, 0.5rem);
  background: white;
  transition: box-shadow 200ms ease;
}
.blog-event-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
.blog-event-card__link {
  display: block;
  text-decoration: none;
  color: inherit;
}
.blog-event-card__body { padding: 1.25rem 1.5rem; }

.blog-event-card__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.blog-event-card__type {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--jc-green, #60b567);
  background: rgba(96, 181, 103, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.blog-event-card__date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.blog-event-card__title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.blog-event-card__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 0.875rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-event-card__more {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--jc-deep-green);
}
</style>
