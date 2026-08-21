<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSiteStore } from '@/stores/useSiteStore';
import { useDonateButton } from '@/composables/useDonateButton';

// Sanity-driven section. Giving always runs through our own Stripe flow, so
// this renders either:
//   • the standard "Give Now" panel (opens the /donate modal), or
//   • a two-card layout when an active campaign overlay is configured in
//     Sanity — the featured campaign beside the direct-giving option.
//
// The Sanity `section` doc only supplies heading + subheading; the campaign
// overlay comes from siteSettings.donationConfig.campaignOverlay.

interface Section {
  heading?: string;
  subheading?: string;
}

const props = defineProps<{ section?: Section | null }>();

const site = useSiteStore();
const { donateHref, handleDonateClick } = useDonateButton();

// Recurring is currently not toggled in this section — kept as a ref so a
// future "monthly vs one-time" picker can flip it. When true, the campaign
// overlay is suppressed (recurring always goes through Stripe).
const isRecurring = ref(false);

const heading = computed(() => props.section?.heading || 'One-Time Gift');
const subheading = computed(
  () => props.section?.subheading || 'Make a secure one-time donation to The Joseph Center.'
);

// Resolved from the store (typed via the getter on useSiteStore).
const campaign = computed(() => site.activeCampaignOverlay);
const showCampaignOverlay = computed(() => !!campaign.value && !isRecurring.value);
</script>

<template>
  <section class="one-time-gift">
    <div class="one-time-gift__banner">
      <h2 class="one-time-gift__banner-title">{{ heading }}</h2>
    </div>

    <div class="one-time-gift__inner">

      <!-- Active campaign overlay — two-card layout -->
      <template v-if="showCampaignOverlay && campaign">
        <div class="one-time-gift__campaign-options">
          <!-- Featured campaign card -->
          <a
            :href="campaign.campaignUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="one-time-gift__campaign-card"
          >
            <div v-if="campaign.badgeText" class="one-time-gift__campaign-badge">
              ★ {{ campaign.badgeText }}
            </div>
            <h3 class="one-time-gift__campaign-name">{{ campaign.campaignName }}</h3>
            <p v-if="campaign.description" class="one-time-gift__campaign-desc">
              {{ campaign.description }}
            </p>
            <span class="btn-secondary one-time-gift__campaign-btn">
              Give via {{ campaign.campaignName }} →
            </span>
          </a>

          <div class="one-time-gift__divider" aria-hidden="true">
            <span>or</span>
          </div>

          <!-- Stripe direct card -->
          <div class="one-time-gift__stripe-card">
            <h3 class="one-time-gift__stripe-name">Give Directly</h3>
            <p class="one-time-gift__stripe-desc">
              Donate securely through The Joseph Center.
            </p>
            <a :href="donateHref" class="btn-primary" @click="handleDonateClick">Give Now</a>
          </div>
        </div>
      </template>

      <!-- No campaign overlay — the standard direct-giving panel -->
      <template v-else>
        <div class="one-time-gift__panel">
          <p class="one-time-gift__copy">{{ subheading }}</p>
          <a :href="donateHref" class="btn-primary one-time-gift__cta" @click="handleDonateClick">
            Give Now
          </a>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.one-time-gift__banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}

.one-time-gift__banner-title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.one-time-gift__inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
}

.one-time-gift__panel {
  text-align: center;
  padding: 2rem;
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  background: white;
}

.one-time-gift__copy {
  color: var(--color-text);
  font-size: var(--text-base);
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.one-time-gift__cta {
  display: inline-block;
}

.one-time-gift__fallback {
  margin: 1.25rem 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
.one-time-gift__fallback a {
  color: var(--jc-deep-green);
  font-weight: 600;
}
.one-time-gift__fallback a:hover { text-decoration: underline; }

/* Campaign overlay layout (Stripe + featured campaign side-by-side) */
.one-time-gift__campaign-options {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: center;
  max-width: 760px;
  margin: 0 auto;
}

.one-time-gift__campaign-card,
.one-time-gift__stripe-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: white;
  border-radius: var(--radius-card, 0.75rem);
  height: 100%;
}

.one-time-gift__campaign-card {
  border: 2px solid var(--jc-gold);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.one-time-gift__campaign-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.one-time-gift__stripe-card {
  border: 1px solid var(--color-border, #e0d8c5);
}

.one-time-gift__campaign-badge {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--jc-gold);
}

.one-time-gift__campaign-name,
.one-time-gift__stripe-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.one-time-gift__campaign-desc,
.one-time-gift__stripe-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
}

.one-time-gift__campaign-btn { text-align: center; margin-top: auto; }

.one-time-gift__divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-style: italic;
}

@media (max-width: 600px) {
  .one-time-gift__campaign-options {
    grid-template-columns: 1fr;
  }
  .one-time-gift__divider {
    padding: 0.25rem 0;
  }
}
</style>
