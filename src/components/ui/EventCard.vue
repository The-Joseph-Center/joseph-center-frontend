<script setup lang="ts">
import { computed } from 'vue';
import { PortableText } from '@portabletext/vue';
import type { TypedObject } from '@portabletext/types';
import SmartLink from '@/components/ui/SmartLink.vue';

const props = defineProps<{
  title: string;
  description?: TypedObject | TypedObject[] | null;
  date?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  detailSlug?: string | null;
}>();

const formattedDate = computed(() => {
  if (!props.date) return null;
  const d = new Date(props.date);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const detailHref = computed(() =>
  props.detailSlug ? `/events/${props.detailSlug}` : null
);

const externalCta = computed(() => {
  if (!props.ctaHref) return false;
  return /^https?:\/\//i.test(props.ctaHref);
});
</script>

<template>
  <article class="event-card">
    <div class="event-card__header">
      <h3 class="event-card__title">{{ title }}</h3>
      <time v-if="formattedDate" class="event-card__date" :datetime="date || undefined">
        {{ formattedDate }}
      </time>
    </div>

    <div class="event-card__body">
      <div v-if="description" class="event-card__description">
        <PortableText :value="description" />
      </div>

      <div class="event-card__footer">
        <SmartLink
          v-if="detailHref"
          :to="detailHref"
          class="event-card__details"
        >
          See details →
        </SmartLink>

        <SmartLink
          v-if="ctaHref && ctaLabel"
          :to="ctaHref"
          :target="externalCta ? '_blank' : undefined"
          :rel="externalCta ? 'noopener noreferrer' : undefined"
          class="btn-primary event-card__cta"
        >
          {{ ctaLabel }}
        </SmartLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  background: white;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.08));
  margin-bottom: 1.5rem;
}

.event-card__header {
  background: var(--jc-gold);
  padding: 0.95rem 1.25rem;
}

.event-card__title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: white;
  margin: 0;
  line-height: 1.3;
}

.event-card__date {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.9);
  margin-top: 0.25rem;
  letter-spacing: 0.04em;
}

.event-card__body {
  padding: 1.25rem 1.5rem 1.5rem;
}

.event-card__description :deep(p) {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0 0 1rem;
}

.event-card__description :deep(p:last-child) {
  margin-bottom: 0;
}

.event-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}

.event-card__details {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 150ms ease;
}

.event-card__details:hover {
  color: var(--jc-deep-green);
  text-decoration: underline;
}

@media (max-width: 480px) {
  .event-card__footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .event-card__cta,
  .event-card__details {
    width: 100%;
    text-align: center;
  }
}
</style>
