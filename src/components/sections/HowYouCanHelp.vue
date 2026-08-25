<script setup lang="ts">
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';
import { useDonateButton } from '@/composables/useDonateButton';

interface Section {
  personDescriptor?: string;
}

// Component supports two callsites:
// 1. Sanity-driven: <HowYouCanHelp :section="..."/> from sectionMap
// 2. Direct: <HowYouCanHelp person-descriptor="..." :donor-ask="..." /> from ProgramPage
const props = withDefaults(defineProps<{
  section?: Section;
  personDescriptor?: string;
  donorIntro?: string;
  donorAsk?: number;
  cta1Label?: string;
  cta1Href?: string;
  cta2Label?: string;
  cta2Href?: string;
}>(), {
  donorAsk: 25,
  cta1Label: 'Become a Financial Partner',
  cta1Href: '/donate',
  cta2Label: 'Sign Up to Volunteer',
  cta2Href: '/forms/volunteer',
});

const personDescriptor = computed(
  () => props.personDescriptor || props.section?.personDescriptor || 'someone in need'
);

// Donate CTA routes via the shared composable so every Give button on the site
// behaves identically. cta1 keeps its prop-driven label (defaults to "Become a
// Financial Partner") but href + click handling come from useDonateButton.
const { donateHref, handleDonateClick } = useDonateButton();

// Split donorIntro on blank lines so each paragraph renders separately
const donorIntroParagraphs = computed(() => {
  if (!props.donorIntro) return [];
  return props.donorIntro.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
});
</script>

<template>
  <section class="how-you-can-help">
    <div class="how-you-can-help__inner">
      <h2 class="how-you-can-help__heading">How You Can Help</h2>

      <div class="how-you-can-help__body">
        <!-- Sanity-driven intro: one or more paragraphs replace the default copy -->
        <template v-if="donorIntroParagraphs.length">
          <p v-for="(para, i) in donorIntroParagraphs" :key="i">{{ para }}</p>
        </template>

        <!-- Fallback default copy when no donorIntro is configured -->
        <template v-else>
          <p class="how-you-can-help__donor-label">
            The Joseph Center is 100% community &amp; foundation funded.
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
            You can help {{ personDescriptor }} for as little as ${{ donorAsk }} a month.
          </p>
        </template>
      </div>

      <div class="how-you-can-help__ctas">
        <!-- Donate CTA — a real <a href="/donate"> so right-click, middle-click
             and "open in new tab" work naturally; the click handler intercepts
             a plain left-click to open the modal in place. -->
        <a :href="donateHref" class="btn-secondary" @click="handleDonateClick">
          {{ cta1Label }}
        </a>
        <SmartLink :to="cta2Href" class="btn-primary">{{ cta2Label }}</SmartLink>
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

/* Matches the 780px centred column every other section on the program page
   uses (vision, how-we-help, campaigns). At 1200px this block started 210px
   further left than the sections above it, which read as the section being
   shifted rather than as a deliberately wider one. */
.how-you-can-help__inner {
  max-width: 780px;
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
