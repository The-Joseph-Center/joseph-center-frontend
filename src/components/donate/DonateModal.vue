<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { useDonationModal } from '@/stores/useDonationModal';
import DonationFlow from './DonationFlow.vue';

// Modal wrapper around DonationFlow. Mounted once at the layout root,
// controlled by the useDonationModal Pinia store.
//
// Behaviors:
//   - Teleported to body so it escapes any parent z-index/overflow context
//   - Body scroll locked while open
//   - ESC and backdrop click close
//   - Focus moved into the dialog on open, restored on close
//   - resetKey from the store bumps DonationFlow state on each re-open

const modal = useDonationModal();

const dialogRef = ref<HTMLDivElement | null>(null);
const previouslyFocused = ref<HTMLElement | null>(null);

const titleId = 'donate-modal-title';

const initialCampaignSlug = computed(() => modal.initialCampaignSlug);
const initialFrequency = computed(() => modal.initialFrequency);
const resetKey = computed(() => modal.openSeq);

function close() {
  modal.close();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    close();
  }
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) close();
}

watch(
  () => modal.isOpen,
  async (open) => {
    if (open) {
      previouslyFocused.value = (document.activeElement as HTMLElement) || null;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeydown);
      await nextTick();
      const root = dialogRef.value;
      if (root) {
        const firstFocusable = root.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeydown);
      previouslyFocused.value?.focus?.();
    }
  }
);

onUnmounted(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="donate-modal">
      <div
        v-if="modal.isOpen"
        class="donate-modal__backdrop"
        @click="handleBackdropClick"
      >
        <div
          ref="dialogRef"
          class="donate-modal__dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <header class="donate-modal__header">
            <h2 :id="titleId" class="donate-modal__title">Give</h2>
            <button
              type="button"
              class="donate-modal__close"
              aria-label="Close donation form"
              @click="close"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div class="donate-modal__body">
            <DonationFlow
              :initial-campaign-slug="initialCampaignSlug"
              :initial-frequency="initialFrequency"
              :reset-key="resetKey"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.donate-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 28, 24, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 2.5rem 1rem;
  -webkit-overflow-scrolling: touch;
}

.donate-modal__dialog {
  background: var(--color-bg);
  border-radius: var(--radius-md, 0.5rem);
  width: 100%;
  max-width: 640px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.donate-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--jc-deep-green);
  border-radius: var(--radius-md, 0.5rem) var(--radius-md, 0.5rem) 0 0;
}

.donate-modal__title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.donate-modal__close {
  background: transparent;
  border: none;
  color: white;
  font-size: 2rem;
  line-height: 1;
  padding: 0 0.25rem;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 150ms ease;
}
.donate-modal__close:hover { opacity: 1; }
.donate-modal__close:focus-visible {
  outline: 2px solid var(--jc-gold);
  outline-offset: 2px;
  border-radius: 4px;
}

.donate-modal__body {
  padding: 1.5rem;
  overflow-y: auto;
}

/* Transitions */
.donate-modal-enter-active,
.donate-modal-leave-active {
  transition: opacity 180ms ease;
}
.donate-modal-enter-from,
.donate-modal-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .donate-modal__backdrop {
    padding: 0;
    align-items: stretch;
  }
  .donate-modal__dialog {
    border-radius: 0;
    min-height: 100dvh;
  }
  .donate-modal__header {
    border-radius: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .donate-modal-enter-active,
  .donate-modal-leave-active {
    transition: none;
  }
}
</style>
