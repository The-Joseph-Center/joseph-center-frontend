<script setup lang="ts">
import { computed } from 'vue';
import { useStayConnectedForm } from '@/composables/useStayConnectedForm';

interface Section {
  heading?: string;
  subtext?: string;
  background?: 'white' | 'cream' | 'deep-green';
}

const props = defineProps<{ section?: Section | null }>();

const heading = computed(() => props.section?.heading || 'Stay Connected');
const subtext = computed(
  () =>
    props.section?.subtext ||
    'Get monthly updates, event news, and stories of hope from The Joseph Center.'
);
const background = computed(() => props.section?.background || 'cream');

const { form, submitting, submitted, error, needsPhone, handleSubmit } =
  useStayConnectedForm('section-embed');
</script>

<template>
  <section class="stay-connected" :class="`stay-connected--${background}`">
    <div class="stay-connected__inner">
      <div class="stay-connected__text">
        <h2 class="stay-connected__heading">{{ heading }}</h2>
        <p v-if="subtext" class="stay-connected__subtext">{{ subtext }}</p>
      </div>

      <div v-if="submitted" class="stay-connected__success">
        <p>You're in! Check your inbox{{ form.wantsSms ? ' (and phone)' : '' }}.</p>
      </div>

      <div v-else class="stay-connected__form">
        <div class="stay-connected__options">
          <label class="stay-connected__option">
            <input type="checkbox" v-model="form.wantsEmail" class="form-checkbox" />
            Email newsletter
          </label>
          <label class="stay-connected__option">
            <input type="checkbox" v-model="form.wantsSms" class="form-checkbox" />
            Text updates
          </label>
        </div>

        <div class="stay-connected__fields">
          <input
            v-if="form.wantsEmail"
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="Email address"
            autocomplete="email"
          />
          <input
            v-if="needsPhone"
            v-model="form.phoneNumber"
            type="tel"
            class="form-input"
            placeholder="Phone number"
            autocomplete="tel"
          />
          <button
            type="button"
            class="btn-primary"
            :disabled="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? 'Subscribing…' : 'Subscribe' }}
          </button>
        </div>

        <p v-if="error" class="stay-connected__error">{{ error }}</p>

        <p class="stay-connected__legal">
          By subscribing you agree to receive communications from The Joseph Center.
          Unsubscribe at any time.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stay-connected {
  padding: 3rem 1.5rem;
}

.stay-connected--cream {
  background: var(--color-bg-secondary);
}

.stay-connected--white {
  background: var(--color-bg);
}

.stay-connected--deep-green {
  background: var(--jc-deep-green);
}

.stay-connected--deep-green .stay-connected__heading,
.stay-connected--deep-green .stay-connected__subtext,
.stay-connected--deep-green .stay-connected__option,
.stay-connected--deep-green .stay-connected__legal {
  color: white;
}

.stay-connected__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2.5rem;
  align-items: center;
}

.stay-connected__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.stay-connected__subtext {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

.stay-connected__options {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.875rem;
  flex-wrap: wrap;
}

.stay-connected__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}

.stay-connected__fields {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stay-connected__fields .form-input {
  flex: 1;
  min-width: 180px;
}

.stay-connected__error {
  font-size: var(--text-sm);
  color: #dc2626;
  margin: 0.5rem 0 0;
}

.stay-connected__legal {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0.75rem 0 0;
}

.stay-connected__success p {
  font-size: var(--text-base);
  color: var(--color-primary);
  font-weight: 500;
  margin: 0;
}

@media (max-width: 768px) {
  .stay-connected__inner {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .stay-connected__fields {
    flex-direction: column;
  }
  .stay-connected__fields .form-input {
    min-width: 0;
  }
}
</style>
