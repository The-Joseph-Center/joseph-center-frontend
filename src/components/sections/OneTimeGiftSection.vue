<script setup lang="ts">
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';

interface Section {
  heading?: string;
  subheading?: string;
}

const props = defineProps<{ section?: Section | null }>();

const provider =
  (import.meta.env.VITE_DONATION_PROVIDER as string | undefined) || 'harness';
const harnessUrl =
  (import.meta.env.VITE_HARNESS_GIVING_URL as string | undefined) || '';

const isHarness = provider === 'harness';
const isStripe = provider === 'stripe';

// If the URL looks like an embeddable Harness widget, render an iframe.
// Otherwise (e.g. just a redirect link), show a Give Now button instead.
const useEmbed = computed(() => {
  if (!isHarness || !harnessUrl) return false;
  return /embed|widget|iframe/i.test(harnessUrl);
});

const heading = computed(() => props.section?.heading || 'One-Time Gift');
const subheading = computed(
  () =>
    props.section?.subheading ||
    'Make a secure one-time donation to The Joseph Center.'
);
</script>

<template>
  <section class="one-time">
    <div class="one-time__banner">
      <h2 class="one-time__banner-title">{{ heading }}</h2>
    </div>

    <div class="one-time__inner">
      <template v-if="isHarness">
        <template v-if="useEmbed">
          <div class="one-time__iframe-wrap">
            <iframe
              :src="harnessUrl"
              class="one-time__iframe"
              title="Make a one-time gift to The Joseph Center"
              loading="lazy"
            />
          </div>
        </template>
        <template v-else>
          <div class="one-time__redirect">
            <p class="one-time__copy">{{ subheading }}</p>
            <SmartLink
              v-if="harnessUrl"
              :to="harnessUrl"
              class="btn-primary one-time__cta"
            >
              Give Now
            </SmartLink>
            <p v-else class="one-time__missing-url">
              Donation link not yet configured. Set <code>VITE_HARNESS_GIVING_URL</code> in your environment.
            </p>
          </div>
        </template>
      </template>

      <template v-else-if="isStripe">
        <div class="one-time__stripe-placeholder">
          <p>Stripe checkout coming soon.</p>
        </div>
      </template>

      <template v-else>
        <div class="one-time__stripe-placeholder">
          <p>Donation provider not configured.</p>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.one-time__banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}

.one-time__banner-title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.one-time__inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
}

.one-time__iframe-wrap {
  width: 100%;
  min-height: 600px;
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  border: 1px solid var(--color-border, #e0d8c5);
  background: white;
}

.one-time__iframe {
  width: 100%;
  min-height: 600px;
  border: none;
  display: block;
}

.one-time__redirect {
  text-align: center;
  padding: 2rem;
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  background: white;
}

.one-time__copy {
  color: var(--color-text);
  font-size: var(--text-base);
  margin: 0 0 1.5rem;
}

.one-time__cta {
  display: inline-block;
}

.one-time__missing-url {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: var(--text-sm);
  margin: 0;
}

.one-time__missing-url code {
  font-family: var(--font-mono, monospace);
  background: var(--color-bg-subtle, #f4f1ea);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.one-time__stripe-placeholder {
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
  padding: 3rem 0;
}
</style>
