<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useHead } from '@unhead/vue';
import SmartLink from '@/components/ui/SmartLink.vue';

useHead({
  title: 'Volunteer Form — The Joseph Center',
  meta: [
    {
      name: 'description',
      content:
        'Sign up to volunteer with The Joseph Center in Grand Junction. Choose your department and availability — every hour you give makes a difference.',
    },
  ],
});

type Slot = 'morning' | 'afternoon' | 'evening';
type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

interface EmploymentEntry {
  organization: string;
  beginDate: string;
  endDate: string;
  responsibilities: string;
}

interface DayAvailability {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

const days: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const slots: Slot[] = ['morning', 'afternoon', 'evening'];
const slotLabels: Record<Slot, string> = {
  morning: '9a–12p',
  afternoon: '12–3p',
  evening: '3–5p',
};

const departmentOptions = [
  { value: 'dayShelter', label: 'Day Shelter' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'parentAdvocacy', label: 'Parent Advocacy' },
  { value: 'events', label: 'Events' },
  { value: 'intakes', label: 'Intakes' },
  { value: 'goldenGirls', label: 'Golden Girls' },
];

function blankDay(): DayAvailability {
  return { morning: false, afternoon: false, evening: false };
}

function blankEmployment(): EmploymentEntry {
  return { organization: '', beginDate: '', endDate: '', responsibilities: '' };
}

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  departments: [] as string[],
  anytime: false,
  availability: {
    monday: blankDay(),
    tuesday: blankDay(),
    wednesday: blankDay(),
    thursday: blankDay(),
    friday: blankDay(),
    saturday: blankDay(),
  } as Record<DayKey, DayAvailability>,
  additionalInfo: '',
  whyVolunteer: '',
  qualifications: '',
  howBenefit: '',
  employment: [blankEmployment(), blankEmployment(), blankEmployment()],
});

const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

const dayLabel = (d: DayKey) => d.charAt(0).toUpperCase() + d.slice(1);

const employmentHasContent = computed(() =>
  form.employment.some(
    (e) =>
      e.organization.trim() ||
      e.beginDate.trim() ||
      e.endDate.trim() ||
      e.responsibilities.trim()
  )
);

function validate(): string | null {
  if (!form.firstName.trim()) return 'First name is required';
  if (!form.lastName.trim()) return 'Last name is required';
  if (!form.email.trim()) return 'Email is required';
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
    const res = await fetch('/.netlify/functions/submit-volunteer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Function reads these named fields directly
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        departments: form.departments,
        availability: { anytime: form.anytime, ...form.availability },
        additionalInfo: form.additionalInfo.trim() || undefined,

        // Extra fields the spec collects — the function bundles these into
        // the additional_info column as JSON so nothing is lost.
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        anytime: form.anytime,
        whyVolunteer: form.whyVolunteer.trim() || undefined,
        qualifications: form.qualifications.trim() || undefined,
        howBenefit: form.howBenefit.trim() || undefined,
        employment: employmentHasContent.value ? form.employment : undefined,
      }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    submitted.value = true;
  } catch {
    error.value =
      'Something went wrong submitting your application. Please try again or call us at (970) 243-7672.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="page page--forms-volunteer">
    <div class="form-banner">
      <h1 class="form-banner__title">Volunteer Form</h1>
    </div>

    <div class="form-wrap">
      <template v-if="submitted">
        <div class="form-success">
          <h2>Thank You!</h2>
          <p>Your volunteer application has been submitted. Our team will be in touch soon.</p>
          <SmartLink to="/" class="btn-primary">Return Home</SmartLink>
        </div>
      </template>

      <form v-else class="volunteer-form" @submit.prevent="handleSubmit" novalidate>
        <!-- Basic Information -->
        <section class="form-section">
          <h2 class="form-section__heading">Basic Information</h2>
          <div class="form-section__divider" />
          <div class="form-row">
            <div class="form-field">
              <label class="form-label" for="vol-firstName">First Name *</label>
              <input
                id="vol-firstName"
                v-model="form.firstName"
                type="text"
                class="form-input"
                required
                autocomplete="given-name"
              />
            </div>
            <div class="form-field">
              <label class="form-label" for="vol-lastName">Last Name *</label>
              <input
                id="vol-lastName"
                v-model="form.lastName"
                type="text"
                class="form-input"
                required
                autocomplete="family-name"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="form-label" for="vol-phone">Phone</label>
              <input
                id="vol-phone"
                v-model="form.phone"
                type="tel"
                class="form-input"
                autocomplete="tel"
              />
            </div>
            <div class="form-field">
              <label class="form-label" for="vol-email">Email *</label>
              <input
                id="vol-email"
                v-model="form.email"
                type="email"
                class="form-input"
                required
                autocomplete="email"
              />
            </div>
          </div>
        </section>

        <!-- Volunteer Department -->
        <section class="form-section">
          <h2 class="form-section__heading">Volunteer Department</h2>
          <div class="form-section__divider" />
          <div class="checkbox-row">
            <label
              v-for="opt in departmentOptions"
              :key="opt.value"
              class="checkbox-item"
            >
              <input
                type="checkbox"
                class="form-checkbox"
                :value="opt.value"
                v-model="form.departments"
              />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </section>

        <!-- Availability -->
        <section class="form-section">
          <h2 class="form-section__heading">Availability</h2>
          <div class="form-section__divider" />
          <label class="checkbox-item checkbox-item--standalone">
            <input
              type="checkbox"
              class="form-checkbox"
              v-model="form.anytime"
            />
            <span>Anytime</span>
          </label>

          <div class="availability-grid">
            <table>
              <thead>
                <tr>
                  <th scope="col"><span class="visually-hidden">Time slot</span></th>
                  <th v-for="day in days" :key="day" scope="col">{{ dayLabel(day) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="slot in slots" :key="slot">
                  <th scope="row">{{ slotLabels[slot] }}</th>
                  <td v-for="day in days" :key="day">
                    <input
                      type="checkbox"
                      class="form-checkbox"
                      v-model="form.availability[day][slot]"
                      :aria-label="`${dayLabel(day)} ${slotLabels[slot]}`"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Additional Information -->
        <section class="form-section">
          <h2 class="form-section__heading">Additional Information</h2>
          <div class="form-section__divider" />
          <div class="form-field">
            <label class="form-label" for="vol-additional">
              Add any additional information that will help us coordinate you to work shifts that will suit you best.
            </label>
            <textarea
              id="vol-additional"
              v-model="form.additionalInfo"
              class="form-input form-textarea"
              rows="3"
            />
          </div>
        </section>

        <!-- About You -->
        <section class="form-section">
          <h2 class="form-section__heading">About You</h2>
          <div class="form-section__divider" />
          <div class="form-field">
            <label class="form-label" for="vol-why">Why do you want to volunteer?</label>
            <textarea
              id="vol-why"
              v-model="form.whyVolunteer"
              class="form-input form-textarea"
              rows="3"
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="vol-quals">What qualifications and skills do you have?</label>
            <textarea
              id="vol-quals"
              v-model="form.qualifications"
              class="form-input form-textarea"
              rows="3"
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="vol-benefit">How do you plan to benefit The Joseph Center?</label>
            <textarea
              id="vol-benefit"
              v-model="form.howBenefit"
              class="form-input form-textarea"
              rows="3"
            />
          </div>
        </section>

        <!-- Employment History -->
        <section class="form-section">
          <h2 class="form-section__heading">Employment History</h2>
          <div class="form-section__divider" />
          <div
            v-for="(entry, idx) in form.employment"
            :key="idx"
            class="employment-entry"
          >
            <p class="employment-entry__label">Position {{ idx + 1 }}</p>
            <div class="form-field">
              <label class="form-label" :for="`vol-emp-${idx}-org`">Organization Name</label>
              <input
                :id="`vol-emp-${idx}-org`"
                v-model="entry.organization"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label" :for="`vol-emp-${idx}-start`">Begin Date</label>
                <input
                  :id="`vol-emp-${idx}-start`"
                  v-model="entry.beginDate"
                  type="date"
                  class="form-input"
                />
              </div>
              <div class="form-field">
                <label class="form-label" :for="`vol-emp-${idx}-end`">End Date</label>
                <input
                  :id="`vol-emp-${idx}-end`"
                  v-model="entry.endDate"
                  type="date"
                  class="form-input"
                />
              </div>
            </div>
            <div class="form-field">
              <label class="form-label" :for="`vol-emp-${idx}-resp`">
                What were your responsibilities in this position?
              </label>
              <textarea
                :id="`vol-emp-${idx}-resp`"
                v-model="entry.responsibilities"
                class="form-input form-textarea"
                rows="3"
              />
            </div>
          </div>
        </section>

        <div v-if="error" class="form-error" role="alert">{{ error }}</div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Submitting…' : 'Submit Application' }}
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
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.form-section {
  margin-bottom: 2.5rem;
}

.form-section__heading {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.form-section__divider {
  height: 2px;
  background: var(--jc-gold);
  margin-bottom: 1.25rem;
  border-radius: 1px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-field:last-child {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.checkbox-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
}

.checkbox-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-item--standalone {
  margin-bottom: 1rem;
}

/* Availability grid */
.availability-grid {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-top: 0.5rem;
}

.availability-grid table {
  border-collapse: collapse;
  min-width: 500px;
  width: 100%;
}

.availability-grid th {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  text-align: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-secondary, var(--color-bg));
  border: 1px solid var(--color-border, #e0d8c5);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.availability-grid tbody th {
  text-align: left;
  min-width: 90px;
  text-transform: none;
}

.availability-grid td {
  text-align: center;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #e0d8c5);
}

.availability-grid input[type="checkbox"] {
  accent-color: var(--jc-gold);
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Employment */
.employment-entry {
  margin-bottom: 2rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--color-border, #e0d8c5);
}

.employment-entry:first-child {
  border-top: none;
  padding-top: 0;
}

.employment-entry__label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
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

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
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
