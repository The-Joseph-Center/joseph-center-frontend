import { computed } from 'vue';
import { useSiteStore } from '@/stores/useSiteStore';
import { useDonationModal } from '@/stores/useDonationModal';

// Shared routing logic for every Give/Donate button on the site.
// The active platform is controlled from Sanity (siteSettings.donationConfig.
// activePlatform). One source of truth — flipping the platform in Studio
// updates every consumer of this composable instantly.
//
// Platform behaviors:
//   • 'colorado-gives' → click navigates to the configured external URL in a
//                        new tab (normal `<a target="_blank">` semantics).
//   • 'harness'        → click opens the Harness widget modal (requires the
//                        Harness script to be loaded — see SiteLayout's
//                        watchEffect). Falls back to a new-tab redirect to
//                        harnessUrl if the widget hasn't initialized.
//   • 'stripe'         → click opens the internal donate modal (existing
//                        DonateModal driven by useDonationModal).
//
// Each consumer renders either an `<a :href :target :rel>` or a `<button>`,
// and wires `@click="handleDonateClick"` to apply the platform-specific
// handler. For colorado-gives and stripe the click handler is basically a
// no-op; for harness it intercepts the navigation and triggers the modal.

declare global {
  interface Window {
    HarnessWidget?: {
      init: (config: { charity_id: string }) => void;
      open: () => void;
    };
  }
}

export function useDonateButton() {
  const site = useSiteStore();
  const modal = useDonationModal();

  const platform = computed(() => site.activeDonationPlatform);

  const donateHref = computed(() => {
    switch (platform.value) {
      case 'colorado-gives': return site.donationConfig?.coloradoGivesUrl ?? '/donate';
      case 'harness':        return site.donationConfig?.harnessUrl ?? '/donate';
      case 'stripe':         return '/donate';
      default:               return '/donate';
    }
  });

  // For external platforms we open in a new tab; for the internal Stripe
  // flow we stay on the current site.
  const donateTarget = computed<'_blank' | '_self'>(() =>
    platform.value === 'stripe' ? '_self' : '_blank'
  );

  const donateRel = computed(() =>
    platform.value === 'stripe' ? '' : 'noopener noreferrer'
  );

  function handleDonateClick(event?: MouseEvent) {
    if (platform.value === 'harness') {
      // Open the widget modal instead of navigating.
      event?.preventDefault();
      if (typeof window !== 'undefined' && window.HarnessWidget?.open) {
        window.HarnessWidget.open();
        return;
      }
      // Script hadn't loaded — fall back to a new-tab redirect.
      const url = site.donationConfig?.harnessUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (platform.value === 'stripe') {
      // For internal flow, prevent the link navigation and open the modal
      // unless the consumer is explicitly rendering a `<router-link>`-style
      // anchor that should navigate to /donate.
      event?.preventDefault();
      modal.open();
      return;
    }
    // colorado-gives falls through to the natural `<a>` navigation.
  }

  return {
    platform,
    donateHref,
    donateTarget,
    donateRel,
    handleDonateClick,
  };
}
