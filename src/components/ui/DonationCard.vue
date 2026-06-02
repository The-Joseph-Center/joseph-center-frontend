<script setup lang="ts">
import SmartLink from '@/components/ui/SmartLink.vue';

withDefaults(
  defineProps<{
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
    buttonVariant?: 'primary' | 'secondary' | 'ghost';
  }>(),
  { buttonVariant: 'primary' }
);

function btnClass(variant?: 'primary' | 'secondary' | 'ghost') {
  switch (variant) {
    case 'secondary': return 'btn-secondary';
    case 'ghost':     return 'btn-ghost';
    case 'primary':
    default:          return 'btn-primary';
  }
}
</script>

<template>
  <div class="donation-card">
    <div class="donation-card__header">{{ title }}</div>
    <div class="donation-card__body">
      <p>{{ description }}</p>
    </div>
    <div class="donation-card__footer">
      <SmartLink
        :to="buttonHref"
        :class="[btnClass(buttonVariant), 'donation-card__btn']"
      >
        {{ buttonLabel }}
      </SmartLink>
    </div>
  </div>
</template>

<style scoped>
.donation-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card, var(--border-radius));
  overflow: hidden;
  background: white;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.08));
}

.donation-card__header {
  background: var(--jc-gold);
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-base);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.75rem 1rem;
}

.donation-card__body {
  padding: 1.25rem 1rem;
  flex: 1;
}

.donation-card__body p {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0;
}

.donation-card__footer {
  padding: 0 1rem 1.25rem;
  margin-top: auto;
}

.donation-card__btn {
  width: 100%;
  justify-content: center;
}
</style>
