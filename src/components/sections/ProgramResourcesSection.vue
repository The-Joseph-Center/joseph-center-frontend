<script setup lang="ts">
import { computed } from 'vue';
import DonationCard from '@/components/ui/DonationCard.vue';

interface CardData {
  enabled?: boolean;
  title?: string;
  description?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

interface Section {
  programName?: string;
  learnCard?: CardData;
  resourcesCard?: CardData;
}

// Supports two callsites:
// 1. Sanity-driven via sectionMap: <ProgramResourcesSection :section="..."/>
// 2. Direct (from ProgramDonationsPage.vue): <ProgramResourcesSection :program-name="..." :learn-card="..."/>
const props = defineProps<{
  section?: Section;
  programName?: string;
  learnCard?: CardData;
  resourcesCard?: CardData;
}>();

const data = computed<Section>(() => ({
  programName: props.programName ?? props.section?.programName ?? 'Program',
  learnCard: props.learnCard ?? props.section?.learnCard,
  resourcesCard: props.resourcesCard ?? props.section?.resourcesCard,
}));

const learnDefaults: Required<Omit<CardData, 'enabled'>> = {
  title: 'Learn',
  description: 'Access educational resources and learn more about the services and support available to you.',
  buttonLabel: 'Learn More',
  buttonHref: '/our-story',
};

const resourcesDefaults: Required<Omit<CardData, 'enabled'>> = {
  title: 'Free Resources',
  description: 'Browse our collection of free resources including guides, forms, and community links.',
  buttonLabel: 'Learn More',
  buttonHref: '/our-story',
};
</script>

<template>
  <section class="program-resources">
    <div class="program-resources__banner">
      <h2 class="program-resources__banner-text">
        {{ data.programName }} Education &amp; Resources
      </h2>
    </div>

    <div class="program-resources__cards">
      <DonationCard
        v-if="data.learnCard?.enabled !== false"
        :title="data.learnCard?.title || learnDefaults.title"
        :description="data.learnCard?.description || learnDefaults.description"
        :button-label="data.learnCard?.buttonLabel || learnDefaults.buttonLabel"
        :button-href="data.learnCard?.buttonHref || learnDefaults.buttonHref"
        button-variant="primary"
      />
      <DonationCard
        v-if="data.resourcesCard?.enabled !== false"
        :title="data.resourcesCard?.title || resourcesDefaults.title"
        :description="data.resourcesCard?.description || resourcesDefaults.description"
        :button-label="data.resourcesCard?.buttonLabel || resourcesDefaults.buttonLabel"
        :button-href="data.resourcesCard?.buttonHref || resourcesDefaults.buttonHref"
        button-variant="primary"
      />
    </div>
  </section>
</template>

<style scoped>
.program-resources__banner {
  background: var(--jc-deep-green);
  clip-path: polygon(0 25%, 100% 0, 100% 75%, 0 100%);
  padding: 3rem 2rem;
  text-align: center;
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.program-resources__banner-text {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.program-resources__cards {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 2.5rem 1.5rem 3rem;
}

@media (max-width: 640px) {
  .program-resources__cards {
    grid-template-columns: 1fr;
  }
}
</style>
