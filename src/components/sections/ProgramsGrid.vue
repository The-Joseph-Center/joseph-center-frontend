<script setup lang="ts">
import { computed } from 'vue';
import ProgramCard from '@/components/ui/ProgramCard.vue';

interface Program {
  name: string;
  description: string;
  href: string;
}

interface Section {
  heading?: string;
  programs?: Program[];
}

const props = defineProps<{ section?: Section }>();

const defaultPrograms: Program[] = [
  {
    name: 'Day Shelter & Food Pantry',
    description: 'We create a safe place for families to eat and shower while managing their path to independence.',
    href: '/programs/day-shelter',
  },
  {
    name: 'Parent Advocacy',
    description: 'Providing parents with a support system to navigate parent / child legal challenges.',
    href: '/programs/family-center',
  },
  {
    name: 'Integrated Financial Services',
    description: 'Our financial services team can help individuals and families navigate financial challenges.',
    href: '/programs/financial-services',
  },
  {
    name: 'Golden Girls',
    description: 'If you are a woman over 50 and need help with housing, we have a program that can help.',
    href: '/programs/golden-girls',
  },
];

const programs = computed(() =>
  props.section?.programs && props.section.programs.length
    ? props.section.programs
    : defaultPrograms
);

const heading = computed(() => props.section?.heading ?? 'Our Programs');
</script>

<template>
  <section class="programs-section">
    <div class="programs-section__inner">
      <h2 v-if="heading" class="programs-section__heading">{{ heading }}</h2>
      <div class="programs-section__grid">
        <ProgramCard
          v-for="program in programs"
          :key="program.name"
          :name="program.name"
          :description="program.description"
          :href="program.href"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.programs-section {
  background: var(--color-bg);
  padding: 0 1.5rem 4rem;
}

.programs-section__inner {
  max-width: 900px;
  margin: 0 auto;
}

.programs-section__heading {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 2rem;
}

.programs-section__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .programs-section__grid {
    grid-template-columns: 1fr;
  }
}
</style>
