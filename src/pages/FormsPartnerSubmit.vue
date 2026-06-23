<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useHead } from '@unhead/vue';
import SmartLink from '@/components/ui/SmartLink.vue';

useHead({
  title: 'Partner Logo Submission — The Joseph Center',
  meta: [
    // Direct-link form — not in nav or footer. Keep out of search results.
    { name: 'robots', content: 'noindex' },
    { name: 'description', content: 'Submit your organization to be considered as a listed partner on The Joseph Center website.' },
  ],
});

const form = reactive({
  orgName: '',
  url: '',
  logoUrl: '',
  notes: '',
});

const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

function validate(): string | null {
  if (!form.orgName.trim()) return 'Organization name is required';
  if (!form.url.trim()) return 'Website URL is required';
  if (!/^https?:\/\//i.test(form.url.trim())) return 'Please enter a full URL starting with http:// or https://';
  if (form.logoUrl.trim() && !/^https?:\/\//i.test(form.logoUrl.trim())) {
    return 'Logo URL should start with http:// or https://';
  }
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
    const res = await fetch('/.netlify/functions/submit-partner-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgName: form.orgName.trim(),
        url: form.url.trim(),
        logoUrl: form.logoUrl.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    submitted.value = true;
  } catch {
    error.value =
      'Something went wrong submitting your information. Please email us at jc@josephcentergj.com.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="page page--partner-submit">
    <div class="form-banner">
      <h1 class="form-banner__title">Partner Logo Submission</h1>
    </div>

    <div class="form-wrap">
      <template v-if="submitted">
        <div class="form-success">
          <h2>Thank You!</h2>
          <p>
            Your information has been submitted. Our team will review it and
            reach out if we have any questions.
          </p>
          <SmartLink to="/" class="btn-primary">Return Home</SmartLink>
        </div>
      </template>

      <form v-else class="partner-form" @submit.prevent="handleSubmit" novalidate>
        <p class="partner-form__intro">
          Submit your organization's information to be considered as a listed
          partner on The Joseph Center website. We'll review every submission
          and reach out with any questions before adding it to the site.
        </p>

        <div class="form-section">
          <div class="form-field">
            <label class="form-label" for="pf-orgName">
              Organization Name <span class="form-required">*</span>
            </label>
            <input
              id="pf-orgName"
              v-model="form.orgName"
              type="text"
              class="form-input"
              autocomplete="organization"
              placeholder="e.g. Mesa County Libraries"
              required
            />
          </div>

          <div class="form-field">
            <label class="form-label" for="pf-url">
              Website URL <span class="form-required">*</span>
            </label>
            <input
              id="pf-url"
              v-model="form.url"
              type="url"
              class="form-input"
              placeholder="https://www.yourorganization.org"
              required
            />
          </div>

          <div class="form-field">
            <label class="form-label" for="pf-logoUrl">Logo URL</label>
            <p class="form-hint">
              Link directly to your logo image file (PNG or SVG preferred).
              If you don't have a direct link, leave this blank and we'll
              pull it from your website.
            </p>
            <input
              id="pf-logoUrl"
              v-model="form.logoUrl"
              type="url"
              class="form-input"
              placeholder="https://www.yourorganization.org/logo.png"
            />
          </div>

          <div class="form-field">
            <label class="form-label" for="pf-notes">Notes (optional)</label>
            <textarea
              id="pf-notes"
              v-model="form.notes"
              class="form-input form-textarea"
              rows="3"
              placeholder="Anything you'd like us to know…"
            />
          </div>
        </div>

        <div v-if="error" class="form-error" role="alert">{{ error }}</div>

        <div class="form-actions">
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
  max-width: 560px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.partner-form__intro {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0 0 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.25rem;
}

.form-label {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.35rem;
}

.form-required { color: var(--jc-deep-green); }

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0 0 0.5rem;
}

.form-error {
  background: #fff4f4;
  border: 1px solid #f5c2c2;
  color: #8a1f1f;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm, 0.5rem);
  font-size: var(--text-sm);
  margin: 0.5rem 0 1.25rem;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.form-success {
  text-align: center;
  padding: 4rem 1rem;
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
  line-height: 1.6;
}
</style>
