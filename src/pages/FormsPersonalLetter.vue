<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useHead } from '@unhead/vue';
import SmartLink from '@/components/ui/SmartLink.vue';

useHead({
  title: 'Get a Personal Letter from Mona — The Joseph Center',
  meta: [
    {
      name: 'description',
      content:
        'Share your mailing address and receive a personal year-end letter from Mona Highline, Founder and CEO of The Joseph Center.',
    },
  ],
});

const form = reactive({
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  state: 'CO',
  zip: '81501',
  email: '',
});

const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

function validate(): string | null {
  if (!form.firstName.trim()) return 'First name is required';
  if (!form.lastName.trim()) return 'Last name is required';
  if (!form.street.trim()) return 'Street address is required';
  if (!form.city.trim()) return 'City is required';
  if (!form.state.trim()) return 'State is required';
  if (!form.zip.trim()) return 'ZIP code is required';
  if (!form.email.trim()) return 'Email address is required';
  if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email address';
  return null;
}

async function handleSubmit() {
  const validationError = validate();
  if (validationError) {
    error.value = validationError;
    return;
  }
  submitting.value = true;
  error.value = '';

  try {
    const res = await fetch('/.netlify/functions/submit-personal-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        street: form.street,
        city: form.city,
        state: form.state,
        zip: form.zip,
        email: form.email,
      }),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    submitted.value = true;
  } catch {
    error.value =
      'Something went wrong. Please try again or call us at (970) 243-7672.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="page page--personal-letter">
    <div class="form-banner">
      <h1 class="form-banner__title">Personal Letter from Mona</h1>
    </div>

    <div class="form-wrap">
      <template v-if="submitted">
        <div class="form-success">
          <h2>Thank You!</h2>
          <p>
            Your mailing address has been received. Mona personally writes to our
            financial partners at the end of each year — watch for your letter!
          </p>
          <SmartLink to="/" class="btn-primary">Return Home</SmartLink>
        </div>
      </template>

      <form
        v-else
        class="personal-letter-form"
        @submit.prevent="handleSubmit"
        novalidate
      >
        <p class="personal-letter-form__intro">
          Mona personally writes to our financial partners at the end of each year.
          Share your mailing address below and you'll receive a letter from her in
          the mail.
        </p>

        <div v-if="error" class="form-error" role="alert">{{ error }}</div>

        <div class="form-row form-row--2col">
          <div class="form-field">
            <label class="form-label" for="pl-firstName">
              First Name <span class="form-required">*</span>
            </label>
            <input
              id="pl-firstName"
              v-model="form.firstName"
              type="text"
              class="form-input"
              autocomplete="given-name"
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="pl-lastName">
              Last Name <span class="form-required">*</span>
            </label>
            <input
              id="pl-lastName"
              v-model="form.lastName"
              type="text"
              class="form-input"
              autocomplete="family-name"
            />
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="pl-street">
            Street Address <span class="form-required">*</span>
          </label>
          <input
            id="pl-street"
            v-model="form.street"
            type="text"
            class="form-input"
            placeholder="123 Main St"
            autocomplete="street-address"
          />
        </div>

        <div class="form-row form-row--city">
          <div class="form-field form-field--city">
            <label class="form-label" for="pl-city">
              City <span class="form-required">*</span>
            </label>
            <input
              id="pl-city"
              v-model="form.city"
              type="text"
              class="form-input"
              autocomplete="address-level2"
            />
          </div>
          <div class="form-field form-field--state">
            <label class="form-label" for="pl-state">
              State <span class="form-required">*</span>
            </label>
            <input
              id="pl-state"
              v-model="form.state"
              type="text"
              class="form-input"
              maxlength="2"
              autocomplete="address-level1"
            />
          </div>
          <div class="form-field form-field--zip">
            <label class="form-label" for="pl-zip">
              ZIP Code <span class="form-required">*</span>
            </label>
            <input
              id="pl-zip"
              v-model="form.zip"
              type="text"
              class="form-input"
              maxlength="10"
              autocomplete="postal-code"
            />
          </div>
        </div>

        <div class="personal-letter-form__divider" aria-hidden="true" />

        <div class="form-field">
          <label class="form-label" for="pl-email">
            Email Address <span class="form-required">*</span>
          </label>
          <p class="form-hint">Used to match your donation record</p>
          <input
            id="pl-email"
            v-model="form.email"
            type="email"
            class="form-input"
            autocomplete="email"
          />
        </div>

        <div class="personal-letter-form__submit">
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Submitting…' : 'Submit' }}
          </button>
        </div>
      </form>
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

.personal-letter-form__intro {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0 0 2rem;
}

.form-row {
  display: grid;
  gap: 1rem;
  margin-bottom: 0;
}

.form-row--2col {
  grid-template-columns: 1fr 1fr;
}

.form-row--city {
  grid-template-columns: 1fr 80px 120px;
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

.personal-letter-form__divider {
  height: 2px;
  background: var(--jc-gold);
  margin: 0.5rem 0 1.5rem;
  border-radius: 1px;
}

.form-error {
  background: #fff4f4;
  border: 1px solid #f5c2c2;
  color: #8a1f1f;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm, 0.5rem);
  margin-bottom: 1.25rem;
  font-size: var(--text-sm);
}

.personal-letter-form__submit {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
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
  .form-row--2col,
  .form-row--city {
    grid-template-columns: 1fr;
  }
}
</style>
