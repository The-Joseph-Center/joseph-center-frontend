<script setup lang="ts">
import SmartLink from '@/components/ui/SmartLink.vue';

defineProps<{
  name: string;
  description: string;
  href: string;
}>();
</script>

<template>
  <article class="program-card">
    <h3 class="program-card__name">{{ name }}</h3>
    <p class="program-card__description">{{ description }}</p>
    <SmartLink :to="href" class="program-card__link">
      Learn More <span aria-hidden="true">→</span>
    </SmartLink>
  </article>
</template>

<style scoped>
.program-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.program-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.program-card__name {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0;
}

.program-card__description {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.program-card__link {
  align-self: flex-end;
  margin-top: auto;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  transition: color 150ms ease;
}

.program-card__link:hover {
  color: var(--color-primary-dark);
}
</style>
