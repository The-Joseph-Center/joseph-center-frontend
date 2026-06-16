import { defineStore } from 'pinia';

// Global state for the donation modal. Any page or component can call
// `useDonationModal().open()` to surface the donation flow without
// navigating away from the current page. Wired to <DonateFab/> +
// <DonateModal/> in SiteLayout.

interface OpenOptions {
  campaignSlug?: string;
  frequency?: 'one-time' | 'monthly';
}

export const useDonationModal = defineStore('donationModal', {
  state: () => ({
    isOpen: false,
    // Optional context passed in when opened — DonationFlow reads these
    // as initial values when present, otherwise falls back to route query.
    initialCampaignSlug: null as string | null,
    initialFrequency: null as 'one-time' | 'monthly' | null,
    // Bumped each time the modal opens; DonationFlow uses it as a reset key
    // so its internal state restarts every time the modal re-opens.
    openSeq: 0,
  }),
  actions: {
    open(opts: OpenOptions = {}) {
      this.initialCampaignSlug = opts.campaignSlug ?? null;
      this.initialFrequency = opts.frequency ?? null;
      this.openSeq += 1;
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    },
  },
});
