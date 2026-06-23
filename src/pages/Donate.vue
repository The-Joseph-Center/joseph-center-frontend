<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { useSanity } from '@/composables/useSanity';
import { sectionMap, pageQuery } from '@/composables/useSections';
import { useRevealObserver } from '@/composables/useRevealObserver';
import DonationFlow from '@/components/donate/DonationFlow.vue';

useHead({
  title: 'Donate — The Joseph Center',
  meta: [
    { name: 'description', content: 'Support The Joseph Center in Grand Junction with a one-time or monthly gift. 100% community & foundation funded — every dollar stays local.' },
  ],
});

const provider = import.meta.env.VITE_DONATION_PROVIDER || 'harness';

// Legacy Sanity sections render when provider != 'stripe' (Harness fallback)
interface LegacyPage {
  sections?: { _key: string; _type: string }[];
}
const { data: page } = useSanity<LegacyPage>(pageQuery('/donate'));
useRevealObserver(page);
</script>

<template>
  <main class="page page--donate">
    <template v-if="provider === 'stripe'">
      <div class="donate-banner">
        <h1 class="donate-banner__title">Give</h1>
      </div>
      <div class="donate-wrap">
        <DonationFlow />
      </div>
    </template>

    <template v-else>
      <template v-for="section in (page?.sections || [])" :key="section._key">
        <component :is="sectionMap[section._type]" v-if="sectionMap[section._type]" :section="section" />
      </template>
    </template>
  </main>
</template>

<style scoped>
.donate-banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}
.donate-banner__title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.donate-wrap {
  max-width: 640px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}
</style>
