<script setup lang="ts">
import { useStayConnectedForm } from '@/composables/useStayConnectedForm';

// Slim signup band rendered inside SiteFooter — sits between the donate
// CTA band and the link columns. Reuses the same composable as
// StayConnectedSection so the canonical opt-in record (Turso) keeps a
// single source label per surface; analytics can split footer signups
// from on-page section signups.
const { form, submitting, submitted, error, needsPhone, handleSubmit } =
  useStayConnectedForm('footer-band');
</script>

<template>
  <div class="footer-subscribe">
    <div class="footer-subscribe__inner">
      <div class="footer-subscribe__copy">
        <h2 class="footer-subscribe__heading">Stay Connected</h2>
        <p class="footer-subscribe__subtext">
          Newsletter and text updates from The Joseph Center.
        </p>
      </div>

      <div v-if="submitted" class="footer-subscribe__success">
        You're in! Check your inbox{{ form.wantsSms ? ' (and phone)' : '' }}.
      </div>

      <form
        v-else
        class="footer-subscribe__form"
        @submit.prevent="handleSubmit"
      >
        <div class="footer-subscribe__row">
          <input
            v-if="form.wantsEmail"
            v-model="form.email"
            type="email"
            class="footer-subscribe__input"
            placeholder="Email address"
            autocomplete="email"
            :aria-label="'Email address'"
          />
          <input
            v-if="needsPhone"
            v-model="form.phoneNumber"
            type="tel"
            class="footer-subscribe__input"
            placeholder="Phone number"
            autocomplete="tel"
            aria-label="Phone number"
          />
          <button
            type="submit"
            class="footer-subscribe__button"
            :disabled="submitting"
          >
            {{ submitting ? 'Subscribing…' : 'Subscribe' }}
          </button>
        </div>

        <div class="footer-subscribe__options">
          <label class="footer-subscribe__option">
            <input type="checkbox" v-model="form.wantsEmail" />
            Email newsletter
          </label>
          <label class="footer-subscribe__option">
            <input type="checkbox" v-model="form.wantsSms" />
            Text updates
          </label>
        </div>

        <p v-if="error" class="footer-subscribe__error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.footer-subscribe {
  background: var(--jc-deep-green);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem 1.5rem;
}

.footer-subscribe__inner {
  max-width: 72rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: center;
}

@media (min-width: 768px) {
  .footer-subscribe__inner {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 2.5rem;
  }
}

.footer-subscribe__heading {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem;
}

.footer-subscribe__subtext {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.footer-subscribe__form {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.footer-subscribe__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer-subscribe__input {
  flex: 1;
  min-width: 0;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: var(--text-sm);
}
.footer-subscribe__input::placeholder { color: rgba(255, 255, 255, 0.55); }
.footer-subscribe__input:focus-visible {
  outline: 2px solid white;
  outline-offset: 1px;
  background: rgba(255, 255, 255, 0.14);
}

.footer-subscribe__button {
  padding: 0.625rem 1.25rem;
  background: white;
  color: var(--jc-deep-green);
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;
  flex-shrink: 0;
}
.footer-subscribe__button:hover:not(:disabled) {
  background: var(--jc-gold);
  color: white;
  transform: translateY(-1px);
}
.footer-subscribe__button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.footer-subscribe__options {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}
.footer-subscribe__option {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}
.footer-subscribe__option input { accent-color: var(--jc-gold); }

.footer-subscribe__error {
  font-size: var(--text-xs);
  color: #ffd1d1;
  margin: 0.25rem 0 0;
}

.footer-subscribe__success {
  font-size: var(--text-sm);
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
}
</style>
