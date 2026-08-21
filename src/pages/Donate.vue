<script setup lang="ts">
import { computed } from 'vue';
import { useHead } from '@unhead/vue';
import DonationFlow from '@/components/donate/DonationFlow.vue';
import { useSiteStore } from '@/stores/useSiteStore';

// /donate is a real, linkable page — it's the URL JC shares on social media
// and in print, so it renders the full donation flow on its own rather than
// only existing as a modal. DonateModal mounts the same DonationFlow component,
// so the two surfaces can never drift apart.

const site = useSiteStore();
// Stripe Customer Portal — shown only once the URL is configured in Studio.
const donorPortalUrl = computed(() => site.donorPortalUrl);

useHead({
  title: 'Donate — The Joseph Center',
  meta: [
    { name: 'description', content: 'Support The Joseph Center in Grand Junction with a one-time or monthly gift. 100% community & foundation funded — every dollar stays local.' },
  ],
});
</script>

<template>
  <main class="page page--donate">
    <div class="donate-banner">
      <h1 class="donate-banner__title">Give to The Joseph Center</h1>
    </div>

    <p class="donate-intro">
      Your gift provides hope, stability, and a sense of belonging to our
      neighbors in need. Every dollar goes to work right here in our community.
    </p>

    <div class="donate-wrap">
      <DonationFlow />

      <p v-if="donorPortalUrl" class="donate-manage">
        Already giving monthly?
        <a :href="donorPortalUrl" target="_blank" rel="noopener noreferrer">Manage your gift</a>
        to update your card, change your amount, or pause your giving.
      </p>
    </div>
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

.donate-intro {
  max-width: 600px;
  margin: 1.75rem auto 0;
  padding: 0 1.5rem;
  text-align: center;
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--color-text-muted);
}

.donate-wrap {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.donate-manage {
  margin: 2rem 0 0;
  text-align: center;
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--color-text-muted);
}
.donate-manage a {
  color: var(--jc-deep-green);
  font-weight: 600;
}
</style>
