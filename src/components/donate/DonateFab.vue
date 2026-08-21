<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '@/stores/useSiteStore';
import { useDonationModal } from '@/stores/useDonationModal';
import { useDonateButton } from '@/composables/useDonateButton';

// Floating "Donate" button, fixed bottom-right. Visible when:
//   • siteSettings.donate.enabled is true (Sanity feature flag)
//   • the donate modal isn't already open (avoids stacking with the modal)
//
// Click opens the internal DonateModal via useDonateButton — the same
// composable used by every other Give button on the site so behavior stays
// in sync.

const site = useSiteStore();
const modal = useDonationModal();
const { donateHref, handleDonateClick } = useDonateButton();

const visible = computed(() =>
  Boolean(site.donate?.enabled) && !modal.isOpen
);

</script>

<template>
  <Transition name="donate-fab">
    <a
      v-if="visible"
      :href="donateHref"
      class="donate-fab"
      aria-label="Donate to The Joseph Center"
      @click="handleDonateClick"
    >
      <svg
        class="donate-fab__icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
      >
        <path
          d="M12 21s-7-4.5-7-10.5C5 7.5 7.5 5 10.5 5c1.5 0 2.7.7 3.5 1.8.8-1.1 2-1.8 3.5-1.8C20.5 5 23 7.5 23 10.5 23 16.5 16 21 12 21z"
          fill="currentColor"
          transform="translate(-1.5 0)"
        />
      </svg>
      <span class="donate-fab__label">Donate</span>
    </a>
  </Transition>
</template>

<style scoped>
.donate-fab {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  z-index: 900;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  background: var(--jc-deep-green);
  color: white;
  text-decoration: none; /* normalize: <a> default underline */
  border: none;
  border-radius: 999px;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
}

.donate-fab:hover {
  background: color-mix(in srgb, var(--jc-deep-green) 90%, black);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
}

.donate-fab:focus-visible {
  outline: 3px solid var(--jc-gold);
  outline-offset: 3px;
}

.donate-fab__icon {
  display: block;
}

@media (max-width: 480px) {
  .donate-fab {
    bottom: 1rem;
    right: 1rem;
    padding: 0.75rem 1.1rem;
    font-size: var(--text-sm);
  }
}

/* Transition */
.donate-fab-enter-active,
.donate-fab-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.donate-fab-enter-from,
.donate-fab-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (prefers-reduced-motion: reduce) {
  .donate-fab,
  .donate-fab-enter-active,
  .donate-fab-leave-active {
    transition: none;
  }
}
</style>
