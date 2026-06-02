<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useSanity } from '@/composables/useSanity';
import SmartLink from '@/components/ui/SmartLink.vue';

type FieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select';

interface FormField {
  _key: string;
  label: string;
  name: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}

interface ActiveDates {
  start?: string | null;
  end?: string | null;
}

interface DynamicForm {
  title?: string;
  active?: boolean;
  activeDates?: ActiveDates | null;
  description?: string;
  fields?: FormField[];
  successMessage?: string;
}

const props = defineProps<{ formSlug: string }>();

const query = `*[_type == "dynamicForm" && slug.current == $slug][0]{
  title, active, activeDates, description, fields, successMessage
}`;

const { data: form, loading } = useSanity<DynamicForm>(query, {
  slug: props.formSlug,
});

const submitting = ref(false);
const submitted = ref(false);
const error = ref('');
const values = reactive<Record<string, string | number>>({});

const isOpen = computed(() => {
  if (!form.value) return false;
  if (form.value.active === false) return false;
  const dates = form.value.activeDates;
  if (!dates) return true;
  const now = Date.now();
  if (dates.start) {
    const t = new Date(dates.start).getTime();
    if (!Number.isNaN(t) && now < t) return false;
  }
  if (dates.end) {
    const t = new Date(dates.end).getTime();
    if (!Number.isNaN(t) && now > t) return false;
  }
  return true;
});

const unavailableMessage = computed(() => {
  if (!form.value) return '';
  if (form.value.active === false) {
    return 'This form is not currently available.';
  }
  const dates = form.value.activeDates;
  if (dates) {
    const now = Date.now();
    if (dates.start) {
      const t = new Date(dates.start).getTime();
      if (!Number.isNaN(t) && now < t) {
        return `This form opens ${new Date(dates.start).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}.`;
      }
    }
    if (dates.end) {
      const t = new Date(dates.end).getTime();
      if (!Number.isNaN(t) && now > t) {
        return 'This form is now closed. Thank you to everyone who participated!';
      }
    }
  }
  return 'This form is not currently available.';
});

function inputType(t: FieldType) {
  switch (t) {
    case 'email':  return 'email';
    case 'phone':  return 'tel';
    case 'number': return 'number';
    case 'text':
    default:       return 'text';
  }
}

function validate(): string | null {
  if (!form.value?.fields) return null;
  for (const field of form.value.fields) {
    if (field.required) {
      const v = values[field.name];
      if (v === undefined || v === null || String(v).trim() === '') {
        return `${field.label} is required`;
      }
    }
    if (field.type === 'email' && values[field.name]) {
      if (!/\S+@\S+\.\S+/.test(String(values[field.name]))) {
        return `${field.label}: please enter a valid email address`;
      }
    }
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
    const res = await fetch('/.netlify/functions/submit-dynamic-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: props.formSlug,
        data: { ...values },
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as { error?: string });
      throw new Error((body as { error?: string }).error || `Server error: ${res.status}`);
    }
    submitted.value = true;
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'Something went wrong submitting the form. Please try again.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="dynamic-form">
    <div v-if="loading" class="dynamic-form__state">
      <p>Loading…</p>
    </div>

    <div v-else-if="!form" class="dynamic-form__state">
      <p>This form could not be found.</p>
    </div>

    <div v-else-if="submitted" class="dynamic-form__success">
      <h2>Thank You!</h2>
      <p>{{ form.successMessage || 'Your submission has been received.' }}</p>
      <SmartLink to="/" class="btn-primary">Return Home</SmartLink>
    </div>

    <div v-else-if="!isOpen" class="dynamic-form__unavailable">
      <p>{{ unavailableMessage }}</p>
    </div>

    <form v-else class="dynamic-form__form" @submit.prevent="handleSubmit" novalidate>
      <p v-if="form.description" class="dynamic-form__description">
        {{ form.description }}
      </p>

      <div v-if="error" class="dynamic-form__error" role="alert">{{ error }}</div>

      <div
        v-for="field in (form.fields || [])"
        :key="field._key"
        class="form-field"
      >
        <label class="form-label" :for="`df-${field._key}`">
          {{ field.label }}
          <span v-if="field.required" class="form-required">*</span>
        </label>

        <select
          v-if="field.type === 'select'"
          :id="`df-${field._key}`"
          v-model="values[field.name]"
          class="form-input"
          :required="field.required"
        >
          <option value="" disabled>Choose one…</option>
          <option v-for="opt in (field.options || [])" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <textarea
          v-else-if="field.type === 'textarea'"
          :id="`df-${field._key}`"
          v-model="values[field.name]"
          class="form-input form-textarea"
          rows="3"
          :required="field.required"
        />

        <input
          v-else
          :id="`df-${field._key}`"
          v-model="values[field.name]"
          :type="inputType(field.type)"
          class="form-input"
          :required="field.required"
          :autocomplete="field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : undefined"
        />
      </div>

      <div class="dynamic-form__submit">
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? 'Submitting…' : 'Submit' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.dynamic-form__state,
.dynamic-form__unavailable {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--color-text-muted);
  font-style: italic;
  background: var(--color-bg-subtle, #f4f1ea);
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
}

.dynamic-form__description {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0 0 1.5rem;
}

.dynamic-form__error {
  background: #fff4f4;
  border: 1px solid #f5c2c2;
  color: #8a1f1f;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm, 0.5rem);
  margin-bottom: 1.25rem;
  font-size: var(--text-sm);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.25rem;
}

.form-required {
  color: #dc2626;
}

.dynamic-form__success {
  text-align: center;
  padding: 3rem 1rem;
}

.dynamic-form__success h2 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

.dynamic-form__success p {
  color: var(--color-text-muted);
  margin: 0 0 2rem;
  line-height: 1.6;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.dynamic-form__submit {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}
</style>
