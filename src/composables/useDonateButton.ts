import { useDonationModal } from '@/stores/useDonationModal';

// Shared routing logic for every Give/Donate button on the site.
//
// Giving runs entirely through our own Stripe flow. There is no platform
// switcher: the Colorado Gives campaign ended and Harness was retired, so
// every Give button now opens the on-site donation modal.
//
// /donate remains a real, linkable page rendering the same flow — it's the URL
// JC shares on social media and in print, so it must keep working on its own.
// Consumers that want a plain navigation (e.g. a footer link) can ignore
// handleDonateClick and just use donateHref.

export function useDonateButton() {
  const modal = useDonationModal();

  const donateHref = '/donate';
  const donateTarget = '_self' as const;
  const donateRel = '';

  function handleDonateClick(event?: MouseEvent) {
    // Open the modal in place rather than navigating away — donors who are
    // mid-page keep their context. The href stays a real URL so middle-click,
    // ctrl-click and "open in new tab" still land on /donate.
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return;
    event?.preventDefault();
    modal.open();
  }

  return { donateHref, donateTarget, donateRel, handleDonateClick };
}
