<script setup lang="ts">
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';

interface Section {
  personDescriptor?: string;
}

// Component supports two callsites:
// 1. Sanity-driven: <HowYouCanHelp :section="..."/> from sectionMap
// 2. Direct: <HowYouCanHelp person-descriptor="a Golden Girl" /> from ProgramPage
const props = defineProps<{
  section?: Section;
  personDescriptor?: string;
}>();

const personDescriptor = computed(
  () => props.personDescriptor || props.section?.personDescriptor || 'someone in need'
);
</script>

<template>
  <section class="how-you-can-help">
    <div class="how-you-can-help__inner">
      <h2 class="how-you-can-help__heading">How You Can Help</h2>

      <div class="how-you-can-help__body">
        <p class="how-you-can-help__donor-label">
          The Joseph Center is 100% donor funded.
        </p>
        <p class="how-you-can-help__emphasis">
          You make our work possible!
        </p>
        <p>
          Our wonderful sponsors, donors and volunteers are our heroes.
          You can become a financial sponsor too and provide for people
          who otherwise would have nowhere to turn.
        </p>
        <p>
          You can help {{ personDescriptor }} for as little as $25 a month.
        </p>
      </div>

      <div class="how-you-can-help__ctas">
        <SmartLink to="/donate" class="btn-secondary">Sponsor a Need</SmartLink>
        <SmartLink to="/forms/volunteer" class="btn-primary">Sign Up to Help</SmartLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-you-can-help {
  padding: 4rem 1.5rem;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.how-you-can-help__inner {
  max-width: 1200px;
  margin: 0 auto;
}

.how-you-can-help__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1.5rem;
}

.how-you-can-help__body {
  max-width: 680px;
  margin-bottom: 2.5rem;
}

.how-you-can-help__body p {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0 0 1rem;
}

.how-you-can-help__donor-label {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--color-text) !important;
  font-size: var(--text-lg) !important;
}

.how-you-can-help__emphasis {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl) !important;
  color: var(--color-text) !important;
}

.how-you-can-help__ctas {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .how-you-can-help__ctas { flex-direction: column; }
  .how-you-can-help__ctas a { text-align: center; }
}
</style>
