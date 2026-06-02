<script setup lang="ts">
import { computed } from 'vue';

interface Section {
  pillars?: string[];
}

const props = defineProps<{ section?: Section }>();

const defaultPillars = [
  'Supporting People',
  'Providing Resources',
  'Restoring Dignity',
];

const pillars = computed(() =>
  props.section?.pillars && props.section.pillars.length
    ? props.section.pillars
    : defaultPillars
);
</script>

<template>
  <section class="pillars-bar" aria-label="Mission pillars">
    <ul class="pillars-bar__list">
      <li v-for="(pillar, i) in pillars" :key="pillar" class="pillars-bar__item" :class="{ 'pillars-bar__item--divider': i > 0 }">
        {{ pillar }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pillars-bar {
  background-color: var(--jc-gold);
  padding: 1rem 2rem;
}

.pillars-bar__list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 1200px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 1rem;
  flex-wrap: wrap;
}

.pillars-bar__item {
  flex: 1;
  text-align: center;
  color: white;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0 1rem;
  position: relative;
}

.pillars-bar__item--divider::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 640px) {
  .pillars-bar__item {
    flex-basis: 100%;
    padding: 0.5rem 0;
  }
  .pillars-bar__item--divider::before {
    display: none;
  }
  .pillars-bar__item--divider {
    border-top: 1px solid rgba(255, 255, 255, 0.5);
  }
}
</style>
