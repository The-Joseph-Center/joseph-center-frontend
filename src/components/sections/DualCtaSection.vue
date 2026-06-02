<script setup lang="ts">
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';

interface CtaButton {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface Section {
  heading?: string;
  body?: string;
  buttons?: CtaButton[];
}

const props = defineProps<{ section?: Section | null }>();

const buttons = computed<CtaButton[]>(() => props.section?.buttons ?? []);

function btnClass(variant?: CtaButton['variant']) {
  switch (variant) {
    case 'secondary': return 'btn-secondary';
    case 'ghost':     return 'btn-ghost';
    case 'primary':
    default:          return 'btn-primary';
  }
}
</script>

<template>
  <section class="dual-cta">
    <div class="dual-cta__inner">
      <h2 v-if="section?.heading" class="dual-cta__heading">{{ section.heading }}</h2>
      <p v-if="section?.body" class="dual-cta__body">{{ section.body }}</p>

      <div v-if="buttons.length" class="dual-cta__buttons">
        <SmartLink
          v-for="btn in buttons"
          :key="btn.label"
          :to="btn.href"
          :class="btnClass(btn.variant)"
        >
          {{ btn.label }}
        </SmartLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dual-cta {
  padding: 3rem 1.5rem;
  background: var(--color-bg);
}

.dual-cta__inner {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.dual-cta__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

.dual-cta__body {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  max-width: 560px;
  line-height: 1.7;
  margin: 0 0 2rem;
}

.dual-cta__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

@media (max-width: 480px) {
  .dual-cta__buttons {
    flex-direction: column;
    width: 100%;
  }
  .dual-cta__buttons a {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
</style>
