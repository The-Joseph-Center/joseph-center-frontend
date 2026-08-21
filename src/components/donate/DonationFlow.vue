<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
import CampaignProgressBar from './CampaignProgressBar.vue';
import SpotlightCard from './SpotlightCard.vue';
import {
  feeCents,
  chargeCents,
  MIN_DONATION_CENTS,
  MAX_DONATION_CENTS,
} from '@/lib/donationFees';

// Standalone 3-screen donation flow. Renders the give → info → payment →
// confirmation states with embedded Stripe Elements. Used by:
//   • Donate.vue (page-level at /donate)
//   • DonateModal.vue (modal opened from the FAB)
//
// Both consumers wrap this with their own chrome (banner, modal frame).

interface Props {
  // When provided, overrides ?campaign= in the route query. Useful for the
  // modal which may be opened with an explicit campaign context.
  initialCampaignSlug?: string | null;
  initialFrequency?: 'one-time' | 'monthly' | null;
  // Bumped externally (e.g. by the modal store) to force this component to
  // reset to step='give' and clear donor info. Watch-driven, not a prop
  // change to data — just a key that increments.
  resetKey?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialCampaignSlug: null,
  initialFrequency: null,
  resetKey: 0,
});

const route = useRoute();

// ─── Step state ───────────────────────────────────────────────────────────

type Step = 'give' | 'info' | 'payment' | 'success';
const step = ref<Step>('give');

type Frequency = 'one-time' | 'monthly';
const frequency = ref<Frequency>('monthly'); // spec default

const ONE_TIME_PRESETS = [25, 50, 100, 250];
const MONTHLY_PRESETS = [15, 25, 50, 100];

const selectedAmount = ref<number | 'custom'>(25);
const customAmount = ref<string>('');

const currentPresets = computed(() =>
  frequency.value === 'monthly' ? MONTHLY_PRESETS : ONE_TIME_PRESETS
);

watch(frequency, () => {
  if (selectedAmount.value !== 'custom') selectedAmount.value = 25;
});

const baseAmountDollars = computed<number>(() => {
  if (selectedAmount.value === 'custom') {
    const v = parseFloat(customAmount.value);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }
  return selectedAmount.value as number;
});

// Fee coverage math lives in @/lib/donationFees so this form and the
// create-donation-session function can never quote different totals. Rate is
// Stripe's discounted 501(c)(3) rate (2.2% + 30c) that JC is enrolled in.
const feeCovered = ref(false);
const baseAmountCents = computed(() => Math.round(baseAmountDollars.value * 100));
const totalDollars = computed(
  () => chargeCents(baseAmountCents.value, feeCovered.value) / 100
);
const feeAmountDollars = computed(() => feeCents(baseAmountCents.value) / 100);

// ─── Donor info ───────────────────────────────────────────────────────────

const donor = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip: '',
});
const emailOptIn = ref(true);
// Honeypot — hidden from real donors, filled in by naive bots. Mirrors the
// _gotcha field the Gatsby donate form used.
const gotcha = ref('');
const hasMailingAddress = computed(() =>
  Boolean(donor.street.trim() && donor.city.trim() && donor.state.trim() && donor.zip.trim())
);

// ─── Campaign + spotlight context ─────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  goal_cents: number | null;
  raised_cents: number | null;
  end_date: string | null;
  show_progress: boolean;
}
interface Spotlight {
  platform_name: string;
  headline: string;
  description: string | null;
  link_url: string;
}

const campaignSlug = computed(() => {
  if (props.initialCampaignSlug) return props.initialCampaignSlug;
  const c = route.query.campaign;
  return typeof c === 'string' && c ? c : null;
});
const campaign = ref<Campaign | null>(null);
const spotlight = ref<Spotlight | null>(null);

// ─── Stripe Elements ──────────────────────────────────────────────────────

let stripe: Stripe | null = null;
let elements: StripeElements | null = null;
const stripeClientSecret = ref('');
const donationId = ref('');
const paymentError = ref('');
const submitting = ref(false);

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtMoney(d: number): string {
  return `$${d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Step transitions ─────────────────────────────────────────────────────

function continueToInfo() {
  if (baseAmountCents.value < MIN_DONATION_CENTS) {
    paymentError.value = 'Please choose or enter an amount of at least $1.';
    return;
  }
  if (baseAmountCents.value > MAX_DONATION_CENTS) {
    paymentError.value =
      `For gifts over ${fmtMoney(MAX_DONATION_CENTS / 100)}, please contact us directly so we can help.`;
    return;
  }
  paymentError.value = '';
  step.value = 'info';
}

async function continueToPayment() {
  if (!donor.firstName.trim() || !donor.lastName.trim() || !donor.email.trim()) {
    paymentError.value = 'Please fill in your name and email.';
    return;
  }
  if (!/\S+@\S+\.\S+/.test(donor.email)) {
    paymentError.value = 'Please enter a valid email address.';
    return;
  }
  paymentError.value = '';
  submitting.value = true;

  try {
    const res = await fetch('/.netlify/functions/create-donation-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Only the intended gift and a yes/no on fees are sent. The charged
        // total is derived server-side so a crafted request can't set its own
        // price — same contract the Gatsby function used.
        baseAmountCents: baseAmountCents.value,
        frequency: frequency.value,
        _gotcha: gotcha.value,
        campaignSlug: campaignSlug.value || undefined,
        donor: {
          firstName: donor.firstName,
          lastName: donor.lastName,
          email: donor.email,
          phone: donor.phone || undefined,
          street: donor.street || undefined,
          city: donor.city || undefined,
          state: donor.state || undefined,
          zip: donor.zip || undefined,
        },
        feeCovered: feeCovered.value,
        emailOptIn: emailOptIn.value,
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to create donation: ${res.status}`);
    }
    const data = await res.json();
    stripeClientSecret.value = data.clientSecret;
    donationId.value = data.donationId;

    step.value = 'payment';
    await nextTick();
    await mountStripeElement();
  } catch (err) {
    paymentError.value =
      err instanceof Error
        ? err.message
        : "We couldn't reach our payment processor. Please check your connection and try again.";
  } finally {
    submitting.value = false;
  }
}

async function mountStripeElement() {
  if (!stripe) {
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      paymentError.value = 'Stripe publishable key not configured.';
      return;
    }
    stripe = await loadStripe(pk);
    if (!stripe) {
      paymentError.value = 'Stripe failed to load.';
      return;
    }
  }
  elements = stripe.elements({ clientSecret: stripeClientSecret.value });
  const paymentElement = elements.create('payment', { layout: 'tabs' });
  paymentElement.mount('#stripe-payment-element');
}

async function completeGift() {
  if (!stripe || !elements) return;
  submitting.value = true;
  paymentError.value = '';
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    redirect: 'if_required',
  });
  if (error) {
    paymentError.value = error.message || 'Payment failed. Please try again.';
    submitting.value = false;
    return;
  }
  if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
    step.value = 'success';
  }
  submitting.value = false;
}

function goBack() {
  if (step.value === 'info') step.value = 'give';
  else if (step.value === 'payment') step.value = 'info';
  paymentError.value = '';
}

// ─── Reset on resetKey bump (modal re-open) ──────────────────────────────

function resetAll() {
  step.value = 'give';
  gotcha.value = '';
  frequency.value = props.initialFrequency ?? 'monthly';
  selectedAmount.value = 25;
  customAmount.value = '';
  feeCovered.value = false;
  donor.firstName = '';
  donor.lastName = '';
  donor.email = '';
  donor.phone = '';
  donor.street = '';
  donor.city = '';
  donor.state = '';
  donor.zip = '';
  emailOptIn.value = true;
  paymentError.value = '';
  submitting.value = false;
  stripeClientSecret.value = '';
  donationId.value = '';
  elements = null;
}

watch(() => props.resetKey, (next, prev) => {
  if (next !== prev) resetAll();
});

// ─── Initial data load ────────────────────────────────────────────────────

async function loadContext() {
  if (props.initialFrequency) {
    frequency.value = props.initialFrequency;
  } else if (route.query.frequency === 'one-time') {
    frequency.value = 'one-time';
  }

  // ?amount=100 pre-selects a gift size — used by the partnership tier CTAs
  // so "Subscribe $100/mo" opens the form already set to $100.
  const amountParam = Number(route.query.amount);
  if (Number.isFinite(amountParam) && amountParam >= 1) {
    if (currentPresets.value.includes(amountParam)) {
      selectedAmount.value = amountParam;
    } else {
      selectedAmount.value = 'custom';
      customAmount.value = String(amountParam);
    }
  }

  if (campaignSlug.value) {
    try {
      const res = await fetch(
        `/.netlify/functions/get-campaign?slug=${encodeURIComponent(campaignSlug.value)}`
      );
      if (res.ok) campaign.value = await res.json();
      else campaign.value = null;
    } catch {
      campaign.value = null;
    }
  } else {
    campaign.value = null;
  }

  try {
    const res = await fetch('/.netlify/functions/get-active-spotlight');
    spotlight.value = res.status === 200 ? await res.json() : null;
  } catch {
    spotlight.value = null;
  }
}

onMounted(loadContext);
// Re-fetch campaign when slug changes (modal re-opens with new context)
watch(campaignSlug, loadContext);
</script>

<template>
  <div class="donation-flow">
    <CampaignProgressBar
      v-if="campaign && step !== 'success'"
      :name="campaign.name"
      :description="campaign.description"
      :goal-cents="campaign.goal_cents"
      :raised-cents="campaign.raised_cents"
      :end-date="campaign.end_date"
      :show-progress="campaign.show_progress"
      class="donation-flow__campaign"
    />

    <!-- Screen 1 — Give -->
    <section v-if="step === 'give'" class="donation-card">
      <h2 class="donation-card__heading">Make a Gift</h2>

      <div class="freq-toggle" role="tablist" aria-label="Gift frequency">
        <button
          type="button"
          role="tab"
          :aria-selected="frequency === 'one-time'"
          :class="['freq-toggle__btn', { 'freq-toggle__btn--active': frequency === 'one-time' }]"
          @click="frequency = 'one-time'"
        >
          One-Time
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="frequency === 'monthly'"
          :class="['freq-toggle__btn', { 'freq-toggle__btn--active': frequency === 'monthly' }]"
          @click="frequency = 'monthly'"
        >
          Monthly
        </button>
      </div>

      <div class="amounts">
        <button
          v-for="amt in currentPresets"
          :key="amt"
          type="button"
          :class="['amount-btn', { 'amount-btn--active': selectedAmount === amt }]"
          @click="selectedAmount = amt"
        >
          ${{ amt }}{{ frequency === 'monthly' ? '/mo' : '' }}
        </button>
        <button
          type="button"
          :class="['amount-btn', { 'amount-btn--active': selectedAmount === 'custom' }]"
          @click="selectedAmount = 'custom'"
        >
          Custom
        </button>
      </div>

      <div v-if="selectedAmount === 'custom'" class="custom-amount">
        <label class="form-label" for="don-custom-amount">Custom amount (USD)</label>
        <input
          id="don-custom-amount"
          v-model="customAmount"
          type="number"
          min="1"
          step="1"
          class="form-input"
          placeholder="50"
        />
      </div>

      <p v-if="paymentError" class="form-error" role="alert">{{ paymentError }}</p>

      <button type="button" class="btn-primary donation-cta" @click="continueToInfo">
        Give Now <span aria-hidden="true">→</span>
      </button>
    </section>

    <!-- Screen 2 — Your Information -->
    <section v-else-if="step === 'info'" class="donation-card">
      <button type="button" class="step-back" @click="goBack">← Back</button>
      <h2 class="donation-card__heading">Your Information</h2>
      <p class="donation-card__intro">
        Almost there. Tell us a little about yourself so we can send your
        confirmation — and a personal note from Mona.
      </p>

      <form class="donor-form" @submit.prevent="continueToPayment" novalidate>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="don-first">First Name *</label>
            <input id="don-first" v-model="donor.firstName" type="text" class="form-input" required autocomplete="given-name" />
          </div>
          <div class="form-field">
            <label class="form-label" for="don-last">Last Name *</label>
            <input id="don-last" v-model="donor.lastName" type="text" class="form-input" required autocomplete="family-name" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="don-email">Email *</label>
            <input id="don-email" v-model="donor.email" type="email" class="form-input" required autocomplete="email" />
          </div>
          <div class="form-field">
            <label class="form-label" for="don-phone">Phone</label>
            <input id="don-phone" v-model="donor.phone" type="tel" class="form-input" autocomplete="tel" />
          </div>
        </div>

        <p class="address-prompt">
          We'd love to send you a personal note from Mona — mind sharing your mailing address?
        </p>
        <div class="form-field">
          <label class="form-label" for="don-street">Street Address</label>
          <input id="don-street" v-model="donor.street" type="text" class="form-input" autocomplete="street-address" />
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="don-city">City</label>
            <input id="don-city" v-model="donor.city" type="text" class="form-input" autocomplete="address-level2" />
          </div>
          <div class="form-field">
            <label class="form-label" for="don-state">State</label>
            <input id="don-state" v-model="donor.state" type="text" class="form-input" maxlength="2" autocomplete="address-level1" />
          </div>
          <div class="form-field">
            <label class="form-label" for="don-zip">Zip</label>
            <input id="don-zip" v-model="donor.zip" type="text" class="form-input" autocomplete="postal-code" />
          </div>
        </div>
        <p v-if="!hasMailingAddress" class="address-nudge">
          Mona loves sending handwritten notes — add your address to receive one.
        </p>

        <label class="checkbox-item">
          <input type="checkbox" v-model="feeCovered" />
          <span>
            Cover the processing fee so The Joseph Center receives my full gift
            <span v-if="feeCovered && baseAmountDollars > 0" class="fee-preview">
              (new total: {{ fmtMoney(totalDollars) }}{{ frequency === 'monthly' ? '/mo' : '' }})
            </span>
          </span>
        </label>
        <label class="checkbox-item">
          <input type="checkbox" v-model="emailOptIn" />
          <span>I'd like to receive email updates from The Joseph Center</span>
        </label>

        <!-- Honeypot — hidden from real donors -->
        <input
          v-model="gotcha"
          type="text"
          name="_gotcha"
          tabindex="-1"
          autocomplete="off"
          class="honeypot"
          aria-hidden="true"
        />

        <p v-if="paymentError" class="form-error" role="alert">
          {{ paymentError }}
          <RouterLink to="/contact">Contact us</RouterLink>
          if the trouble continues and we will gladly take your gift by phone.
        </p>

        <button type="submit" class="btn-primary donation-cta" :disabled="submitting">
          {{ submitting ? 'Just a moment…' : 'Continue →' }}
        </button>
      </form>
    </section>

    <!-- Screen 3 — Payment -->
    <section v-else-if="step === 'payment'" class="donation-card">
      <button type="button" class="step-back" @click="goBack">← Back</button>
      <h2 class="donation-card__heading">Payment</h2>

      <div class="order-summary">
        <p v-if="campaign" class="order-summary__row">
          <span>Campaign</span><strong>{{ campaign.name }}</strong>
        </p>
        <p class="order-summary__row">
          <span>Frequency</span><strong>{{ frequency === 'monthly' ? 'Monthly' : 'One-Time' }}</strong>
        </p>
        <p class="order-summary__row">
          <span>Subtotal</span><strong>{{ fmtMoney(baseAmountDollars) }}</strong>
        </p>
        <p class="order-summary__row">
          <span>Processing fee</span>
          <strong>{{ feeCovered ? fmtMoney(feeAmountDollars) : '$0.00 (not covered)' }}</strong>
        </p>
        <p class="order-summary__row order-summary__row--total">
          <span>Total</span>
          <strong>{{ fmtMoney(totalDollars) }}{{ frequency === 'monthly' ? '/mo' : '' }}</strong>
        </p>
      </div>

      <div id="stripe-payment-element" class="stripe-element" />

      <p v-if="paymentError" class="form-error" role="alert">{{ paymentError }}</p>

      <button type="button" class="btn-primary donation-cta" :disabled="submitting" @click="completeGift">
        {{ submitting ? 'Processing…' : 'Complete My Gift →' }}
      </button>

      <p class="legal-copy legal-copy--trust">
        Payments are processed securely by Stripe. The Joseph Center never sees
        or stores your card details.
      </p>
      <p class="legal-copy">
        By completing your gift, you agree to our
        <a href="/terms-and-conditions">Terms &amp; Conditions</a> and
        <a href="/privacy-policy">Privacy Policy</a>. The Joseph Center is a
        501(c)(3) nonprofit. Your gift may be tax-deductible.
      </p>
      <p v-if="frequency === 'monthly'" class="legal-copy">
        You'll be charged {{ fmtMoney(totalDollars) }} on this day of each month.
        To update or cancel your recurring gift, contact us at
        <a href="mailto:jc@josephcentergj.com">jc@josephcentergj.com</a>.
      </p>
    </section>

    <!-- Confirmation -->
    <section v-else class="donation-card donation-card--success">
      <h2 class="donation-card__heading">Thank You</h2>
      <template v-if="frequency === 'one-time'">
        <p class="success-line">
          Thank you, {{ donor.firstName }}. Your gift is on its way to
          someone who needs it. A confirmation is headed to {{ donor.email }}.
        </p>
      </template>
      <template v-else>
        <p class="success-line">
          Thank you, {{ donor.firstName }}. You're now a monthly partner of
          The Joseph Center. Your first gift of {{ fmtMoney(totalDollars) }} has been processed,
          and you'll be charged on this day of each month going forward.
          A confirmation is on its way to {{ donor.email }}.
        </p>
      </template>
      <p v-if="hasMailingAddress" class="success-line">
        And watch your mailbox — Mona will be in touch.
      </p>
    </section>

    <SpotlightCard
      v-if="spotlight && step !== 'success'"
      :platform-name="spotlight.platform_name"
      :headline="spotlight.headline"
      :description="spotlight.description"
      :link-url="spotlight.link_url"
      class="donation-flow__spotlight"
    />
  </div>
</template>

<style scoped>
.donation-flow {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.donation-flow__campaign { order: 0; }
.donation-card           { order: 1; }
.donation-flow__spotlight { order: 2; }

.donation-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-md, 0.5rem);
  padding: 2rem 1.75rem;
}

.donation-card__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem;
}

.donation-card__intro {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.step-back {
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 1rem;
  color: var(--jc-deep-green);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

/* Frequency toggle */
.freq-toggle {
  display: inline-flex;
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: 999px;
  padding: 0.2rem;
  margin-bottom: 1.5rem;
  background: var(--color-bg-secondary, var(--color-bg));
}
.freq-toggle__btn {
  border: none;
  background: transparent;
  padding: 0.55rem 1.25rem;
  border-radius: 999px;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
}
.freq-toggle__btn--active {
  background: var(--jc-deep-green);
  color: white;
}

/* Amount presets */
.amounts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.amount-btn {
  border: 2px solid var(--color-border, #e0d8c5);
  background: var(--color-bg);
  padding: 0.85rem 1rem;
  border-radius: var(--radius-sm, 0.5rem);
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;
}
.amount-btn:hover { border-color: var(--jc-gold); }
.amount-btn--active {
  border-color: var(--jc-deep-green);
  background: color-mix(in srgb, var(--jc-deep-green) 6%, transparent);
}

.custom-amount { margin-bottom: 1.25rem; }

/* Donor form */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.form-row:has(> :nth-child(3)) {
  grid-template-columns: 2fr 1fr 1fr;
}
.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}
@media (max-width: 600px) {
  .form-row,
  .form-row:has(> :nth-child(3)) {
    grid-template-columns: 1fr;
  }
}

.form-label {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

.address-prompt {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-style: italic;
  margin: 1.5rem 0 0.75rem;
}
.address-nudge {
  font-size: var(--text-xs);
  color: var(--jc-deep-green);
  margin: 0.25rem 0 1rem;
}

.checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  margin: 0.5rem 0;
}
.fee-preview {
  display: inline-block;
  font-weight: 600;
  color: var(--jc-deep-green);
  margin-left: 0.25rem;
}

/* Order summary on payment step */
.order-summary {
  background: var(--color-bg-secondary, var(--color-bg));
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-sm, 0.5rem);
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}
.order-summary__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 0.4rem;
}
.order-summary__row strong {
  font-family: var(--font-heading);
  color: var(--color-text);
}
.order-summary__row--total {
  border-top: 1px solid var(--color-border, #e0d8c5);
  padding-top: 0.65rem;
  margin-top: 0.65rem;
  font-size: var(--text-base);
}
.order-summary__row--total strong { font-size: var(--text-lg); }

/* Stripe Element container */
.stripe-element {
  margin-bottom: 1.5rem;
  min-height: 200px;
}

.legal-copy {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0.75rem 0 0;
}
.legal-copy a { color: var(--jc-deep-green); }

.donation-cta {
  width: 100%;
  margin-top: 0.5rem;
}

.donation-card--success {
  border-color: var(--jc-gold);
}
.success-line {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.7;
  margin: 0 0 0.75rem;
}

.form-error {
  background: #fff4f4;
  border: 1px solid #f5c2c2;
  color: #8a1f1f;
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-sm, 0.5rem);
  font-size: var(--text-sm);
  margin: 0.5rem 0 0;
}

.honeypot {
  display: none;
}

.legal-copy--trust {
  color: var(--color-text);
}
</style>
