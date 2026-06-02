<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useHead } from '@unhead/vue';
import SmartLink from '@/components/ui/SmartLink.vue';

useHead({
  title: 'Apply to be a Guest — Coffee Chat with Mona',
  meta: [
    {
      name: 'description',
      content:
        "Apply to share your story on Coffee Chat with Mona at The Joseph Center. We love sharing real stories of hope from our community.",
    },
  ],
});

// ─── State ────────────────────────────────────────────────────────
const currentStep = ref(1);
const totalSteps = 9;
const submitting = ref(false);
const submitted = ref(false);
const notEligible = ref(false);
const stepError = ref('');

const form = reactive({
  // 1 — Contact
  email: '',
  // 2 — About You
  fullName: '',
  contactEmail: '',
  phone: '',
  connection: '',
  is18Plus: '' as 'yes' | 'no' | '',
  // 3 — Your Story
  impactStatement: '',
  programsInvolved: [] as string[],
  hasLegalMatters: '' as 'yes' | 'no' | '',
  sensitiveTopics: '',
  // 4 — On-Camera Readiness
  comfortableRecorded: '' as 'yes' | 'no' | '',
  nameDisplay: '',
  accommodations: '',
  // 5 — Media Release
  mediaReleaseGranted: '' as 'yes' | 'no' | '',
  // 6 — Expectations (all must be confirmed)
  expectationsConfirmed: [] as string[],
  // 7 — Scheduling
  bestDays: [] as string[],
  bestTimes: [] as string[],
  contactMethods: [] as string[],
  // 8 — Anything Else
  additionalInfo: '',
  // 9 — Signature
  signature: '',
  signatureDate: new Date().toISOString().split('T')[0],
});

const connectionOptions = [
  'Guest',
  'Family Member',
  'Volunteer',
  'Donor / Partner',
  'Staff / Board',
  'Community Member',
  'Other',
];

const programs = [
  'Family Center / Parent Advocacy',
  'Day Shelter',
  'Food Pantry / Daily Meals',
  'Integrated Financial Services',
  'Golden Girls',
  'Events & Outreach',
  'Other',
];

const expectations = [
  'I understand this is a public interview, not counseling or legal advice.',
  'I will avoid sharing confidential case details or full names of minors.',
  'The Joseph Center may edit the interview for length/clarity and choose not to publish.',
  'Scheduling and participation are not guaranteed; sessions may be rescheduled or declined.',
  'Typical recording time is ~20–30 minutes; clips may be 15–60 seconds, and/or a longer episode.',
  'No payment is offered.',
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const times = ['Morning (9–11a)', 'Afternoon (11a–2p)', 'Evening (2–5p)'];
const contactMethodOptions = ['Email', 'Phone', 'Text'];

const stepTitles = [
  'Contact',
  'About You',
  'Your Story',
  'On-Camera Readiness',
  'Media Release',
  'Expectations',
  'Scheduling',
  'Anything Else?',
  'Consent & Signature',
];

const progressPct = computed(() => (currentStep.value / totalSteps) * 100);

// ─── Disqualification ────────────────────────────────────────────
function checkEligibility(): boolean {
  if (form.is18Plus === 'no') {
    notEligible.value = true;
    return true;
  }
  if (form.comfortableRecorded === 'no') {
    notEligible.value = true;
    return true;
  }
  if (form.mediaReleaseGranted === 'no') {
    notEligible.value = true;
    return true;
  }
  return false;
}

function resetEligibility() {
  notEligible.value = false;
}

// ─── Per-step validation ─────────────────────────────────────────
function validateStep(step: number): string | null {
  switch (step) {
    case 1:
      if (!form.email.trim()) return 'Email is required.';
      if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email.';
      return null;
    case 2:
      if (!form.fullName.trim()) return 'Full name is required.';
      if (!form.connection) return 'Please select your connection to The Joseph Center.';
      if (!form.is18Plus) return 'Please confirm your age.';
      return null;
    case 3:
      if (!form.impactStatement.trim())
        return 'Please share how The Joseph Center has impacted you.';
      if (!form.programsInvolved.length) return 'Please select at least one program.';
      if (!form.hasLegalMatters) return 'Please answer the legal matters question.';
      return null;
    case 4:
      if (!form.comfortableRecorded) return 'Please answer the recording question.';
      if (!form.nameDisplay) return 'Please choose how to identify you.';
      return null;
    case 5:
      if (!form.mediaReleaseGranted) return 'Please select your media release preference.';
      return null;
    case 6:
      if (form.expectationsConfirmed.length < expectations.length)
        return 'Please confirm all expectations to continue.';
      return null;
    case 7:
      if (!form.contactMethods.length)
        return 'Please select at least one preferred contact method.';
      return null;
    case 8:
      return null;
    case 9:
      if (!form.signature.trim()) return 'Electronic signature is required.';
      if (!form.signatureDate) return 'Date is required.';
      return null;
    default:
      return null;
  }
}

// ─── Navigation ──────────────────────────────────────────────────
function nextStep() {
  stepError.value = '';
  const err = validateStep(currentStep.value);
  if (err) {
    stepError.value = err;
    return;
  }
  if (checkEligibility()) return;
  if (currentStep.value < totalSteps) currentStep.value++;
}

function prevStep() {
  stepError.value = '';
  notEligible.value = false;
  if (currentStep.value > 1) currentStep.value--;
}

// ─── Submit ──────────────────────────────────────────────────────
async function handleSubmit() {
  stepError.value = '';
  const err = validateStep(9);
  if (err) {
    stepError.value = err;
    return;
  }

  submitting.value = true;
  try {
    const res = await fetch('/.netlify/functions/submit-coffee-chat-guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        fullName: form.fullName,
        contactEmail: form.contactEmail || null,
        phone: form.phone || null,
        connection: form.connection,
        is18Plus: form.is18Plus === 'yes',
        impactStatement: form.impactStatement,
        programsInvolved: form.programsInvolved,
        hasLegalMatters: form.hasLegalMatters === 'yes',
        sensitiveTopics: form.sensitiveTopics || null,
        comfortableRecorded: form.comfortableRecorded === 'yes',
        nameDisplay: form.nameDisplay,
        accommodations: form.accommodations || null,
        mediaReleaseGranted: form.mediaReleaseGranted === 'yes',
        expectationsConfirmed:
          form.expectationsConfirmed.length === expectations.length,
        bestDays: form.bestDays,
        bestTimes: form.bestTimes,
        contactMethods: form.contactMethods,
        additionalInfo: form.additionalInfo || null,
        signature: form.signature,
        signatureDate: form.signatureDate,
      }),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    submitted.value = true;
  } catch {
    stepError.value =
      'Something went wrong. Please try again or contact us at (970) 243-7672.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="page page--coffee-chat-apply">
    <div class="form-banner">
      <h1 class="form-banner__title">Apply to Be a Guest</h1>
    </div>

    <div class="form-wrap">
      <div class="coffee-intro">
        <p>
          We love sharing real stories of hope. If The Joseph Center has impacted
          you and you'd like to join Mona for a Coffee Chat, fill this out. This
          is a <strong>public, recorded interview</strong> (audio/video) that we
          may edit for length and clarity and publish on our channels.
        </p>
        <p class="coffee-intro__disclaimer">
          <strong>Important:</strong> This is not counseling, legal advice, or
          crisis support. Don't share confidential case details, full names of
          minors, or anything restricted by a court order.
        </p>
        <p class="coffee-intro__disclaimer">
          <strong>Please allow up to 30 days for a response.</strong> Not every
          submission will be selected; we prioritize stories that fit upcoming
          topics and safety guidelines.
        </p>
      </div>

      <template v-if="submitted">
        <div class="form-success">
          <h2>Application Submitted!</h2>
          <p>
            Thank you for sharing your story. Mona and her team will review your
            application and reach out within 30 days if selected.
          </p>
          <SmartLink to="/media" class="btn-primary">Back to Coffee Chat</SmartLink>
        </div>
      </template>

      <div v-else-if="notEligible" class="coffee-not-eligible">
        <h2>Thank You for Your Interest</h2>
        <p>
          At this time, Coffee Chat with Mona is limited to adults who consent
          to recording and media release. If your situation changes, you're
          welcome to apply again.
        </p>
        <button type="button" class="btn-outline" @click="resetEligibility">
          ← Go Back
        </button>
      </div>

      <div v-else class="coffee-form">
        <!-- Progress -->
        <div class="coffee-form__progress">
          <span class="coffee-form__step-label">
            Step {{ currentStep }} of {{ totalSteps }} — {{ stepTitles[currentStep - 1] }}
          </span>
          <div class="coffee-form__progress-bar">
            <div
              class="coffee-form__progress-fill"
              :style="{ width: `${progressPct}%` }"
            />
          </div>
        </div>

        <!-- Step 1: Contact -->
        <div v-if="currentStep === 1" class="coffee-form__step">
          <div class="form-field">
            <label class="form-label" for="cc-email">
              Email Address <span class="form-required">*</span>
            </label>
            <input
              id="cc-email"
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>
        </div>

        <!-- Step 2: About You -->
        <div v-if="currentStep === 2" class="coffee-form__step">
          <div class="form-field">
            <label class="form-label" for="cc-fullName">
              Full Name <span class="form-required">*</span>
            </label>
            <input
              id="cc-fullName"
              v-model="form.fullName"
              type="text"
              class="form-input"
              placeholder="Your full name"
              autocomplete="name"
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="cc-contactEmail">
              Preferred Contact Email (if different)
            </label>
            <input
              id="cc-contactEmail"
              v-model="form.contactEmail"
              type="email"
              class="form-input"
              placeholder="other@example.com"
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="cc-phone">Phone</label>
            <input
              id="cc-phone"
              v-model="form.phone"
              type="tel"
              class="form-input"
              placeholder="(970) 555-0100"
              autocomplete="tel"
            />
          </div>
          <div class="form-field">
            <label class="form-label">
              Your connection to The Joseph Center
              <span class="form-required">*</span>
            </label>
            <div class="radio-group">
              <label v-for="opt in connectionOptions" :key="opt" class="radio-option">
                <input type="radio" v-model="form.connection" :value="opt" />
                {{ opt }}
              </label>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">
              Are you 18 or older? <span class="form-required">*</span>
            </label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="form.is18Plus" value="yes" /> Yes
              </label>
              <label class="radio-option">
                <input type="radio" v-model="form.is18Plus" value="no" /> No
              </label>
            </div>
          </div>
        </div>

        <!-- Step 3: Your Story -->
        <div v-if="currentStep === 3" class="coffee-form__step">
          <div class="form-field">
            <label class="form-label" for="cc-impact">
              In 2–5 sentences, how has The Joseph Center impacted you?
              <span class="form-required">*</span>
            </label>
            <textarea
              id="cc-impact"
              v-model="form.impactStatement"
              class="form-input form-textarea"
              rows="5"
              placeholder="Share your story..."
            />
          </div>
          <div class="form-field">
            <label class="form-label">
              Programs involved (check all that apply)
              <span class="form-required">*</span>
            </label>
            <div class="checkbox-group">
              <label v-for="prog in programs" :key="prog" class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="form.programsInvolved"
                  :value="prog"
                  class="form-checkbox"
                />
                {{ prog }}
              </label>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">
              Are there any ongoing legal/court matters related to this story?
              <span class="form-required">*</span>
            </label>
            <p class="form-hint">If yes, we may delay or decline scheduling to protect you.</p>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="form.hasLegalMatters" value="no" /> No
              </label>
              <label class="radio-option">
                <input type="radio" v-model="form.hasLegalMatters" value="yes" /> Yes
              </label>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="cc-sensitive">
              Anything sensitive you do NOT want discussed on camera?
            </label>
            <textarea
              id="cc-sensitive"
              v-model="form.sensitiveTopics"
              class="form-input form-textarea"
              rows="3"
            />
          </div>
        </div>

        <!-- Step 4: On-Camera Readiness -->
        <div v-if="currentStep === 4" class="coffee-form__step">
          <div class="form-field">
            <label class="form-label">
              Are you comfortable being recorded (video + audio) for public release?
              <span class="form-required">*</span>
            </label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="form.comfortableRecorded" value="yes" /> Yes
              </label>
              <label class="radio-option">
                <input type="radio" v-model="form.comfortableRecorded" value="no" /> No
              </label>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">
              How should we identify you? <span class="form-required">*</span>
            </label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="form.nameDisplay" value="Full name" />
                Full name
              </label>
              <label class="radio-option">
                <input type="radio" v-model="form.nameDisplay" value="First name only" />
                First name only
              </label>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="cc-accommodations">
              Accessibility or accommodations needed?
            </label>
            <textarea
              id="cc-accommodations"
              v-model="form.accommodations"
              class="form-input form-textarea"
              rows="3"
            />
          </div>
        </div>

        <!-- Step 5: Media Release -->
        <div v-if="currentStep === 5" class="coffee-form__step">
          <div class="form-field">
            <label class="form-label">
              Media Release <span class="form-required">*</span>
            </label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="form.mediaReleaseGranted" value="yes" />
                <span>
                  I grant The Joseph Center permission to record, edit, and publish my
                  interview for nonprofit, promotional, and educational purposes.
                </span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="form.mediaReleaseGranted" value="no" />
                I do not grant permission
              </label>
            </div>
          </div>
        </div>

        <!-- Step 6: Expectations -->
        <div v-if="currentStep === 6" class="coffee-form__step">
          <div class="form-field">
            <label class="form-label">
              Please confirm all of the following: <span class="form-required">*</span>
            </label>
            <div class="checkbox-group">
              <label v-for="exp in expectations" :key="exp" class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="form.expectationsConfirmed"
                  :value="exp"
                  class="form-checkbox"
                />
                {{ exp }}
              </label>
            </div>
          </div>
        </div>

        <!-- Step 7: Scheduling -->
        <div v-if="currentStep === 7" class="coffee-form__step">
          <p class="form-hint coffee-form__scheduling-hint">
            All video filming will be on site at The Joseph Center.
          </p>
          <div class="form-field">
            <label class="form-label">Best days</label>
            <div class="checkbox-group checkbox-group--horizontal">
              <label v-for="day in days" :key="day" class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="form.bestDays"
                  :value="day"
                  class="form-checkbox"
                />
                {{ day }}
              </label>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">Best times</label>
            <div class="checkbox-group">
              <label v-for="time in times" :key="time" class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="form.bestTimes"
                  :value="time"
                  class="form-checkbox"
                />
                {{ time }}
              </label>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">
              Preferred contact method <span class="form-required">*</span>
            </label>
            <div class="checkbox-group checkbox-group--horizontal">
              <label
                v-for="method in contactMethodOptions"
                :key="method"
                class="checkbox-option"
              >
                <input
                  type="checkbox"
                  v-model="form.contactMethods"
                  :value="method"
                  class="form-checkbox"
                />
                {{ method }}
              </label>
            </div>
          </div>
        </div>

        <!-- Step 8: Anything Else -->
        <div v-if="currentStep === 8" class="coffee-form__step">
          <div class="form-field">
            <label class="form-label" for="cc-additional">
              What else should we know before scheduling?
            </label>
            <textarea
              id="cc-additional"
              v-model="form.additionalInfo"
              class="form-input form-textarea"
              rows="5"
            />
          </div>
        </div>

        <!-- Step 9: Consent & Signature -->
        <div v-if="currentStep === 9" class="coffee-form__step">
          <div class="form-field">
            <label class="form-label" for="cc-signature">
              Type your full name to sign electronically
              <span class="form-required">*</span>
            </label>
            <input
              id="cc-signature"
              v-model="form.signature"
              type="text"
              class="form-input"
              placeholder="Your full legal name"
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="cc-date">
              Date <span class="form-required">*</span>
            </label>
            <input
              id="cc-date"
              v-model="form.signatureDate"
              type="date"
              class="form-input"
            />
          </div>
        </div>

        <div v-if="stepError" class="coffee-form__error" role="alert">
          {{ stepError }}
        </div>

        <div class="coffee-form__nav">
          <button
            v-if="currentStep > 1"
            type="button"
            class="btn-outline"
            @click="prevStep"
          >
            ← Back
          </button>
          <button
            v-if="currentStep < totalSteps"
            type="button"
            class="btn-primary"
            @click="nextStep"
          >
            Next →
          </button>
          <button
            v-else
            type="button"
            class="btn-primary"
            :disabled="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? 'Submitting…' : 'Submit Application' }}
          </button>
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
  max-width: 720px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

/* Intro */
.coffee-intro {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border, #e0d8c5);
}

.coffee-intro p {
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.7;
  margin: 0 0 0.75rem;
}

.coffee-intro__disclaimer {
  font-size: var(--text-sm) !important;
  color: var(--color-text-muted) !important;
}

/* Progress */
.coffee-form__progress {
  margin-bottom: 2rem;
}

.coffee-form__step-label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--jc-gold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 0.5rem;
}

.coffee-form__progress-bar {
  height: 4px;
  background: var(--color-border, #e0d8c5);
  border-radius: 2px;
  overflow: hidden;
}

.coffee-form__progress-fill {
  height: 100%;
  background: var(--jc-green);
  border-radius: 2px;
  transition: width 300ms ease;
}

.coffee-form__step {
  margin-bottom: 1.5rem;
}

.coffee-form__scheduling-hint {
  margin-bottom: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.form-required {
  color: #dc2626;
}

/* Radio + checkbox groups */
.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 0.5rem;
}

.checkbox-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  line-height: 1.5;
}

.radio-option input[type='radio'],
.checkbox-option input[type='checkbox'] {
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: var(--jc-green);
}

.coffee-form__error {
  background: #fff4f4;
  border: 1px solid #f5c2c2;
  color: #8a1f1f;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm, 0.5rem);
  font-size: var(--text-sm);
  margin-bottom: 1rem;
}

.coffee-form__nav {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.coffee-form__nav .btn-primary {
  margin-left: auto;
}

/* Not eligible */
.coffee-not-eligible {
  padding: 2rem 0;
}

.coffee-not-eligible h2 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--color-text);
  margin: 0 0 1rem;
}

.coffee-not-eligible p {
  color: var(--color-text-muted);
  margin: 0 0 2rem;
  max-width: 560px;
  line-height: 1.7;
}

/* Success */
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
</style>
