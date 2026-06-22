<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useHead } from '@unhead/vue';
import { useSanity } from '@/composables/useSanity';
import SmartLink from '@/components/ui/SmartLink.vue';

useHead({
  title: 'Volunteer Form — The Joseph Center',
  meta: [
    {
      name: 'description',
      content:
        'Sign up to volunteer with The Joseph Center in Grand Junction. Tell us a little about yourself and where you’d like to help.',
    },
  ],
});

// ─── Sanity-driven skills config ──────────────────────────────────────────

interface SkillCategory {
  name: string;
  active?: boolean; // false = hidden from form; the category persists in Sanity
  skills: string[];
}

const defaultSkillCategories: SkillCategory[] = [
  { name: 'Media & Creative', skills: ['Photography', 'Videography', 'Graphic Design'] },
  { name: 'Medical & Wellness', skills: ['Medical / Nursing', 'Dental', 'Vision'] },
  { name: 'Trades & Facilities', skills: ['Carpentry / Repairs', 'Plumbing', 'Electrical', 'Landscaping / Groundskeeping', 'Painting'] },
  { name: 'Other', skills: ['Transportation / Driving', 'Teaching / Tutoring', 'Grant Writing', 'Spanish Interpretation', 'Sign Language (ASL) Interpretation', 'Other Language Interpretation'] },
];

const { data: skillsConfig } = useSanity<{ categories?: SkillCategory[] }>(
  `*[_id == "volunteerSkills"][0]{ categories[]{ name, active, skills } }`
);

const skillCategories = computed<SkillCategory[]>(() => {
  const fromSanity = skillsConfig.value?.categories;
  const source = fromSanity && fromSanity.length > 0 ? fromSanity : defaultSkillCategories;
  // Hide categories explicitly marked inactive; treat missing `active` as true
  // for backward compatibility with the older doc shape.
  return source.filter((c) => c.active !== false);
});

// ─── Availability grid ────────────────────────────────────────────────────

type Slot = 'morning' | 'afternoon' | 'evening';
type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

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

// Departments per 06/16/26 staff review (round 2): Day Shelter, Kitchen,
// Family Center, Events, Intakes, Golden Girls Project, Wherever I'm needed.
const departmentOptions = [
  { value: 'dayShelter', label: 'Day Shelter' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'familyCenter', label: 'Family Center' },
  { value: 'events', label: 'Events' },
  { value: 'intakes', label: 'Intakes' },
  { value: 'goldenGirlsProject', label: 'Golden Girls Project' },
  { value: 'whereverNeeded', label: "Wherever I'm needed" },
];

function blankDay(): DayAvailability {
  return { morning: false, afternoon: false, evening: false };
}

// ─── Tab state (UI-only — both Program and Skills selections submit together) ──

type ActiveTab = 'program' | 'skills';
const activeTab = ref<ActiveTab>('program');

// ─── Form state ───────────────────────────────────────────────────────────

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  departments: [] as string[],
  skills: [] as string[],
  anytime: false,
  availability: {
    monday: blankDay(),
    tuesday: blankDay(),
    wednesday: blankDay(),
    thursday: blankDay(),
    friday: blankDay(),
    saturday: blankDay(),
  } as Record<DayKey, DayAvailability>,
  whyJC: '',
  aboutYou: '',
  anythingElse: '',
});

const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

const dayLabel = (d: DayKey) => d.charAt(0).toUpperCase() + d.slice(1);

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
        // Single-flow form — skills is now a section, not a separate tab.
        // volunteer_type is always 'program' but kept in the payload so the
        // function's older email-routing logic still resolves cleanly.
        volunteer_type: 'program',
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        departments: form.departments,
        skills: form.skills.length ? form.skills : undefined,
        availability: { anytime: form.anytime, ...form.availability },
        anytime: form.anytime,
        whyJC: form.whyJC.trim() || undefined,
        aboutYou: form.aboutYou.trim() || undefined,
        anythingElse: form.anythingElse.trim() || undefined,
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
          <p>Thanks — we'll be in touch within one business day.</p>
          <SmartLink to="/" class="btn-primary">Return Home</SmartLink>
        </div>
      </template>

      <template v-else>
        <p class="form-intro">
          We're glad you're here. Tell us a little about yourself and where you'd
          like to help — we'll reach out within one business day to find the best fit.
        </p>

        <form class="volunteer-form" @submit.prevent="handleSubmit" novalidate>
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

          <!-- Where Would You Like to Help? — unified section with Program / Skills tabs -->
          <section class="form-section">
            <h2 class="form-section__heading">Where Would You Like to Help?</h2>
            <div class="form-section__divider" />

            <!-- Visible regardless of active tab — sets the tone before
                 anyone starts picking checkboxes. -->
            <p class="form-section__note">
              Any volunteer time is appreciated — even just sitting with a
              guest and listening matters to us. Pick a program below, switch
              to Skills to share what you bring, or both.
            </p>

            <div class="tabs" role="tablist" aria-label="Volunteer type">
              <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 'program'"
                :class="['tabs__btn', { 'tabs__btn--active': activeTab === 'program' }]"
                @click="activeTab = 'program'"
              >
                Program Volunteer
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 'skills'"
                :class="['tabs__btn', { 'tabs__btn--active': activeTab === 'skills' }]"
                @click="activeTab = 'skills'"
              >
                Skills Volunteer
              </button>
            </div>

            <!-- Program tab — department checkboxes -->
            <div v-if="activeTab === 'program'" role="tabpanel" class="tab-panel">
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
            </div>

            <!-- Skills tab — Sanity-driven category groups -->
            <div v-else role="tabpanel" class="tab-panel">
              <div
                v-for="cat in skillCategories"
                :key="cat.name"
                class="skill-category"
              >
                <h3 class="skill-category__name">{{ cat.name }}</h3>
                <div class="checkbox-row">
                  <label
                    v-for="skill in cat.skills"
                    :key="skill"
                    class="checkbox-item"
                  >
                    <input
                      type="checkbox"
                      class="form-checkbox"
                      :value="skill"
                      v-model="form.skills"
                    />
                    <span>{{ skill }}</span>
                  </label>
                </div>
              </div>
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

          <!-- About You -->
          <section class="form-section">
            <h2 class="form-section__heading">About You</h2>
            <div class="form-section__divider" />

            <div class="form-field">
              <label class="form-label" for="vol-whyJC">
                What made you choose The Joseph Center?
              </label>
              <textarea
                id="vol-whyJC"
                v-model="form.whyJC"
                class="form-input form-textarea"
                rows="4"
                placeholder="Tell us what brought you here…"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="vol-about">Tell us about yourself</label>
              <textarea
                id="vol-about"
                v-model="form.aboutYou"
                class="form-input form-textarea"
                rows="5"
                placeholder="Why you want to volunteer and anything you'd like us to know about your experience."
              />
            </div>
          </section>

          <!-- Anything Else? -->
          <section class="form-section">
            <h2 class="form-section__heading">Anything Else?</h2>
            <div class="form-section__divider" />
            <div class="form-field">
              <label class="visually-hidden" for="vol-anything-else">Anything else?</label>
              <textarea
                id="vol-anything-else"
                v-model="form.anythingElse"
                class="form-input form-textarea"
                rows="3"
                placeholder="Is there anything else that would help us find the right fit for you?"
              />
            </div>
          </section>

          <div v-if="error" class="form-error" role="alert">{{ error }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Submitting…' : "I'm Ready to Help →" }}
            </button>
          </div>
        </form>
      </template>
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

.form-intro {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin: 0 0 2.5rem;
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

.form-section__note {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

/* Tab switcher inside "Where Would You Like to Help?" */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-border, #e0d8c5);
}

.tabs__btn {
  flex: 1;
  padding: 0.85rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;
}

.tabs__btn:hover { color: var(--color-text); }

.tabs__btn--active {
  color: var(--color-text);
  border-bottom-color: var(--jc-gold);
}

.tab-panel {
  /* Both tabs share this container — no extra chrome, just the checkboxes */
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
.form-field:last-child { margin-bottom: 0; }

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
}

.checkbox-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
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
.checkbox-item--standalone { margin-bottom: 1rem; }

/* Skill categories */
.skill-category {
  margin-bottom: 1.5rem;
}
.skill-category:last-child { margin-bottom: 0; }

.skill-category__name {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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
