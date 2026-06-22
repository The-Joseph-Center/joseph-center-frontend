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
    name: 'Day Shelter',
    description: 'A safe place to rest, shower, do laundry, and figure out what comes next — open to anyone in the Grand Valley.',
    href: '/programs/day-shelter',
  },
  {
    name: 'Food Pantry',
    description: 'Hot meals and food boxes for our guests in Grand Junction, every Tuesday through Friday.',
    href: '/programs/food-pantry',
  },
  {
    name: 'Parent Advocacy',
    description: 'Providing parents with a support system to navigate parent / child legal challenges.',
    href: '/programs/family-center',
  },
  {
    name: 'Integrated Financial Services',
    description: 'Our financial services team can help individuals and families navigate financial challenges.',
    href: '/programs/integrated-financial-services',
  },
  {
    name: 'Golden Girls Project',
    description: 'Temporary housing and support for women over 50 starting over in the Grand Valley.',
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
