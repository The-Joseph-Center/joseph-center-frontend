<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { useStayConnectedForm } from '@/composables/useStayConnectedForm';
import SmartLink from '@/components/ui/SmartLink.vue';

useHead({
  title: 'Stay Connected — The Joseph Center',
  meta: [
    {
      name: 'description',
      content:
        'Subscribe to The Joseph Center newsletter and text updates. Get monthly program highlights, event news, and stories of hope.',
    },
  ],
});

const { form, submitting, submitted, error, needsPhone, handleSubmit } =
  useStayConnectedForm('stay-connected-page');
</script>

<template>
  <main class="page page--stay-connected">
    <div class="form-banner">
      <h1 class="form-banner__title">Stay Connected</h1>
    </div>

    <div class="form-wrap">
      <template v-if="submitted">
        <div class="form-success">
          <h2>You're in!</h2>
          <p>
            Thanks for signing up. Check your inbox for newsletter updates, and
            your phone for text updates if you opted in.
          </p>
          <SmartLink to="/" class="btn-primary">Return Home</SmartLink>
        </div>
      </template>

      <div v-else class="stay-form">
        <p class="stay-form__intro">
          Choose how you'd like to hear from The Joseph Center — monthly email
          updates, text messages, or both.
        </p>

        <div class="stay-form__options">
          <label
            class="stay-form__option-card"
            :class="{ 'stay-form__option-card--active': form.wantsEmail }"
          >
            <input type="checkbox" v-model="form.wantsEmail" class="sr-only" />
            <div class="stay-form__check">
              <span v-if="form.wantsEmail">✓</span>
            </div>
            <div>
              <p class="stay-form__option-title">Email Newsletter</p>
              <p class="stay-form__option-desc">
                Monthly updates on programs, events, volunteer opportunities,
                and stories of hope. Delivered to your inbox.
              </p>
            </div>
          </label>

          <label
            class="stay-form__option-card"
            :class="{ 'stay-form__option-card--active': form.wantsSms }"
          >
            <input type="checkbox" v-model="form.wantsSms" class="sr-only" />
            <div class="stay-form__check">
              <span v-if="form.wantsSms">✓</span>
            </div>
            <div>
              <p class="stay-form__option-title">Text Updates</p>
              <p class="stay-form__option-desc">
                4–6 monthly texts featuring real stories from our guests, program
                updates, and partnership opportunities. No spam.
              </p>
            </div>
          </label>
        </div>

        <div class="stay-form__fields">
          <div class="form-row form-row--2col">
            <div class="form-field">
              <label class="form-label" for="sc-firstName">First Name</label>
              <input
                id="sc-firstName"
                v-model="form.firstName"
                type="text"
                class="form-input"
                autocomplete="given-name"
              />
            </div>
            <div class="form-field">
              <label class="form-label" for="sc-lastName">Last Name</label>
              <input
                id="sc-lastName"
                v-model="form.lastName"
                type="text"
                class="form-input"
                autocomplete="family-name"
              />
            </div>
          </div>

          <div v-if="form.wantsEmail" class="form-field">
            <label class="form-label" for="sc-email">
              Email Address <span class="form-required">*</span>
            </label>
            <input
              id="sc-email"
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>

          <div v-if="needsPhone" class="form-field">
            <label class="form-label" for="sc-phone">
              Phone Number <span class="form-required">*</span>
            </label>
            <input
              id="sc-phone"
              v-model="form.phoneNumber"
              type="tel"
              class="form-input"
              placeholder="(970) 555-0100"
              autocomplete="tel"
            />
            <p class="form-hint">
              Message and data rates may apply. Text STOP to unsubscribe.
            </p>
          </div>

          <div v-if="error" class="form-error" role="alert">{{ error }}</div>

          <button
            type="button"
            class="btn-primary stay-form__submit"
            :disabled="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? 'Subscribing…' : 'Subscribe' }}
          </button>

          <p class="stay-form__legal">
            By subscribing you agree to receive communications from The Joseph Center.
            You may unsubscribe at any time by clicking the unsubscribe link in any
            email, or texting STOP to opt out of texts.
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.form-banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}

.form-banner__title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.form-wrap {
  max-width: 680px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.stay-form__intro {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0 0 2rem;
}

.stay-form__options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stay-form__option-card {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  padding: 1.25rem;
  border: 2px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;
  background: white;
}

.stay-form__option-card--active {
  border-color: var(--jc-green);
  background: var(--color-primary-light);
}

.stay-form__check {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border, #e0d8c5);
  border-radius: 3px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--jc-green);
  font-weight: 700;
  margin-top: 1px;
  background: white;
  transition: border-color 150ms ease;
}

.stay-form__option-card--active .stay-form__check {
  border-color: var(--jc-green);
}

.stay-form__option-title {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.stay-form__option-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
}

.form-row {
  display: grid;
  gap: 1rem;
}

.form-row--2col {
  grid-template-columns: 1fr 1fr;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.25rem;
}

.form-row .form-field {
  margin-bottom: 1.25rem;
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.form-required {
  color: #dc2626;
}

.form-error {
  background: #fff4f4;
  border: 1px solid #f5c2c2;
  color: #8a1f1f;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm, 0.5rem);
  margin-bottom: 1rem;
  font-size: var(--text-sm);
}

.stay-form__submit {
  width: 100%;
  justify-content: center;
  margin-top: 0.5rem;
}

.stay-form__legal {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: 1rem;
  line-height: 1.5;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.form-success {
  text-align: center;
  padding: 3rem 0;
}

.form-success h2 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

.form-success p {
  color: var(--color-text-muted);
  margin: 0 0 2rem;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

@media (max-width: 560px) {
  .stay-form__options,
  .form-row--2col {
    grid-template-columns: 1fr;
  }
}
</style>
