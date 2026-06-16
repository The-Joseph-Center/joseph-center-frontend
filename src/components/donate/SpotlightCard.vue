<script setup lang="ts">
interface Props {
  platformName: string;
  headline: string;
  description?: string | null;
  linkUrl: string;
}

defineProps<Props>();
</script>

<template>
  <aside class="spotlight">
    <p class="spotlight__platform">{{ platformName }} spotlight</p>
    <h3 class="spotlight__headline">{{ headline }}</h3>
    <p v-if="description" class="spotlight__description">{{ description }}</p>
    <a :href="linkUrl" target="_blank" rel="noopener noreferrer" class="spotlight__cta">
      Contribute on {{ platformName }} <span aria-hidden="true">→</span>
    </a>
  </aside>
</template>

<style scoped>
.spotlight {
  background: var(--color-bg);
  border: 1px solid var(--color-border, #e0d8c5);
  border-left: 4px solid var(--jc-teal, #3F8B96);
  border-radius: var(--radius-md, 0.5rem);
  padding: 1.25rem 1.5rem;
}

.spotlight__platform {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--jc-teal, #3F8B96);
  margin: 0 0 0.5rem;
}

.spotlight__headline {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.spotlight__description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.55;
  margin: 0 0 1rem;
}

.spotlight__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--jc-teal, #3F8B96);
  text-decoration: none;
}

.spotlight__cta:hover {
  text-decoration: underline;
}
</style>
