<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  name: string;
  description?: string | null;
  goalCents?: number | null;
  raisedCents?: number | null;
  endDate?: string | null;
  showProgress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  description: null,
  goalCents: null,
  raisedCents: null,
  endDate: null,
  showProgress: true,
});

function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const percent = computed(() => {
  const goal = props.goalCents ?? 0;
  const raised = props.raisedCents ?? 0;
  if (!goal) return 0;
  return Math.min(100, Math.max(0, (raised / goal) * 100));
});

const showBar = computed(() => props.showProgress && (props.goalCents ?? 0) > 0);

const raisedLine = computed(() => {
  if (!showBar.value) return '';
  return `${formatDollars(props.raisedCents ?? 0)} raised toward a ${formatDollars(props.goalCents ?? 0)} goal`;
});

const endDateLine = computed(() =>
  props.endDate ? `Goal date: ${formatDate(props.endDate)}` : ''
);
</script>

<template>
  <div class="campaign-progress">
    <h3 class="campaign-progress__name">{{ name }}</h3>
    <p v-if="description" class="campaign-progress__description">{{ description }}</p>

    <template v-if="showBar">
      <div class="campaign-progress__bar-wrap" role="progressbar"
           :aria-valuenow="Math.round(percent)" aria-valuemin="0" aria-valuemax="100">
        <div class="campaign-progress__bar" :style="{ width: `${percent}%` }" />
      </div>
      <p class="campaign-progress__raised">{{ raisedLine }}</p>
      <p v-if="endDateLine" class="campaign-progress__end-date">{{ endDateLine }}</p>
    </template>
  </div>
</template>

<style scoped>
.campaign-progress {
  background: var(--color-bg);
  border: 1px solid var(--color-border, #e0d8c5);
  border-left: 4px solid var(--jc-gold);
  border-radius: var(--radius-md, 0.5rem);
  padding: 1.25rem 1.5rem;
}

.campaign-progress__name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.4rem;
}

.campaign-progress__description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.55;
  margin: 0 0 1rem;
}

.campaign-progress__bar-wrap {
  width: 100%;
  height: 12px;
  background: var(--color-border, #e0d8c5);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.campaign-progress__bar {
  height: 100%;
  background: var(--jc-deep-green);
  border-radius: 999px;
  transition: width 600ms ease;
}

.campaign-progress__raised {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.campaign-progress__end-date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0.25rem 0 0;
}
</style>
