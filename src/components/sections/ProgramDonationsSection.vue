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
  sponsorCard?: CardData;
  donateCard?: CardData;
}

// Supports two callsites:
// 1. Sanity-driven via sectionMap: <ProgramDonationsSection :section="..."/>
// 2. Direct (from ProgramDonationsPage.vue): <ProgramDonationsSection :program-name="..." :sponsor-card="..."/>
const props = defineProps<{
  section?: Section;
  programName?: string;
  sponsorCard?: CardData;
  donateCard?: CardData;
}>();

const data = computed<Section>(() => ({
  programName: props.programName ?? props.section?.programName ?? 'Program',
  sponsorCard: props.sponsorCard ?? props.section?.sponsorCard,
  donateCard: props.donateCard ?? props.section?.donateCard,
}));

const sponsorDefaults: Required<Omit<CardData, 'enabled'>> = {
  title: 'Sponsor an Event',
  description: 'Partner with us to sponsor events that support people in need in the Grand Valley.',
  buttonLabel: 'Contact Us',
  buttonHref: '/contact',
};

const donateDefaults: Required<Omit<CardData, 'enabled'>> = {
  title: 'Donate Supplies',
  description: 'Your donated supplies make a direct impact on the people we serve every day.',
  buttonLabel: 'Give',
  buttonHref: '/donate',
};
</script>

<template>
  <section class="program-donations">
    <div class="program-donations__banner">
      <h2 class="program-donations__banner-text">
        {{ data.programName }} Donations
      </h2>
    </div>

    <div class="program-donations__cards">
      <DonationCard
        v-if="data.sponsorCard?.enabled !== false"
        :title="data.sponsorCard?.title || sponsorDefaults.title"
        :description="data.sponsorCard?.description || sponsorDefaults.description"
        :button-label="data.sponsorCard?.buttonLabel || sponsorDefaults.buttonLabel"
        :button-href="data.sponsorCard?.buttonHref || sponsorDefaults.buttonHref"
        button-variant="primary"
      />
      <DonationCard
        v-if="data.donateCard?.enabled !== false"
        :title="data.donateCard?.title || donateDefaults.title"
        :description="data.donateCard?.description || donateDefaults.description"
        :button-label="data.donateCard?.buttonLabel || donateDefaults.buttonLabel"
        :button-href="data.donateCard?.buttonHref || donateDefaults.buttonHref"
        button-variant="primary"
      />
    </div>
  </section>
</template>

<style scoped>
.program-donations__banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}

.program-donations__banner-text {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.program-donations__cards {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 2.5rem 1.5rem;
}

@media (max-width: 640px) {
  .program-donations__cards {
    grid-template-columns: 1fr;
  }
}
</style>
