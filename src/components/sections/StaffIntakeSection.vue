<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { DEPARTMENTS } from '@/lib/departments';

// ─────────────────────────────────────────────────────────────────────────
// TEMPORARY — internal staff intake tool.
//
// Two jobs, both aimed at getting details out of managers' heads and into a
// form JC can key into Sanity:
//   1. Identify the staff photos that were uploaded but never attached to
//      anyone. Each carries a stable designation so the answers can be matched
//      back to the right image afterwards.
//   2. Correct the title and department on the staff who already exist.
//
// Nothing is written to Sanity — everything is emailed for review.
//
// To remove: delete this section from the /staff page in Studio. The component,
// netlify/functions/submit-staff-intake.ts and its email template can then be
// deleted too.
// ─────────────────────────────────────────────────────────────────────────

interface Section {
  heading?: string;
  intro?: string;
}
defineProps<{ section?: Section | null }>();

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

interface Asset {
  _id: string;
  url: string;
  originalFilename?: string | null;
}
interface StaffDoc {
  _id: string;
  name?: string;
  title?: string | null;
  departments?: string[] | null;
}

interface PhotoRow {
  designation: string;
  assetId: string;
  imageUrl: string;
  filename: string;
  name: string;
  title: string;
  departments: string[];
  quote: string;
}
interface StaffRow {
  staffId: string;
  name: string;
  titleBefore: string;
  departmentsBefore: string[];
  title: string;
  departments: string[];
}

const photos = ref<PhotoRow[]>([]);
const staff = ref<StaffRow[]>([]);
const loading = ref(true);
const loadError = ref('');

const submittedBy = ref('');
const gotcha = ref('');
const submitting = ref(false);
const submitError = ref('');
const submitted = ref(false);
const result = ref<{ identified: number; changed: number } | null>(null);

// Every department is offered, including the internal triage bucket — a manager
// who recognises the face but not the team needs somewhere to put them.
const departmentOptions = DEPARTMENTS;

/**
 * A designation derived from the asset id, NOT from position in the list.
 * Attaching any one photo to a staff document removes it from the unattached
 * set, which would renumber a positional scheme and silently invalidate every
 * code written down beforehand. The id never changes, so neither does this.
 */
function designationFor(assetId: string): string {
  return `IMG-${assetId.replace(/^image-/, '').slice(0, 6).toUpperCase()}`;
}

async function query<T>(groq: string): Promise<T> {
  const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', groq);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
  return (await res.json()).result as T;
}

onMounted(async () => {
  try {
    const [assets, people] = await Promise.all([
      // Image assets no document references — the unidentified photos.
      query<Asset[]>(
        `*[_type == "sanity.imageAsset" && count(*[references(^._id)]) == 0] | order(_createdAt asc){_id, url, originalFilename}`
      ),
      query<StaffDoc[]>(
        `*[_type == "staff" && !(_id in path("drafts.**"))] | order(name asc){_id, name, title, departments}`
      ),
    ]);

    photos.value = (assets ?? []).map((a) => ({
      designation: designationFor(a._id),
      assetId: a._id,
      imageUrl: a.url,
      filename: decodeURIComponent(a.originalFilename ?? ''),
      name: '',
      title: '',
      departments: [],
      quote: '',
    }));

    staff.value = (people ?? []).map((s) => ({
      staffId: s._id,
      name: s.name ?? '(unnamed)',
      titleBefore: s.title ?? '',
      departmentsBefore: [...(s.departments ?? [])],
      title: s.title ?? '',
      departments: [...(s.departments ?? [])],
    }));
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Could not load the staff data.';
  } finally {
    loading.value = false;
  }
});

function toggleDept(row: { departments: string[] }, value: string) {
  const i = row.departments.indexOf(value);
  if (i === -1) row.departments.push(value);
  else row.departments.splice(i, 1);
}

const filledPhotos = computed(() =>
  photos.value.filter((p) => p.name.trim() || p.title.trim() || p.departments.length || p.quote.trim())
);
const changedStaff = computed(() =>
  staff.value.filter(
    (s) =>
      s.title.trim() !== s.titleBefore.trim() ||
      [...s.departments].sort().join('|') !== [...s.departmentsBefore].sort().join('|')
  )
);
const hasSomethingToSend = computed(() => filledPhotos.value.length > 0 || changedStaff.value.length > 0);

async function submit() {
  if (!hasSomethingToSend.value) {
    submitError.value = 'Fill in at least one photo or change a staff detail before submitting.';
    return;
  }
  submitting.value = true;
  submitError.value = '';
  try {
    const res = await fetch('/.netlify/functions/submit-staff-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submittedBy: submittedBy.value,
        _gotcha: gotcha.value,
        identifications: filledPhotos.value.map((p) => ({
          designation: p.designation,
          assetId: p.assetId,
          imageUrl: p.imageUrl,
          filename: p.filename,
          name: p.name,
          title: p.title,
          departments: p.departments,
          quote: p.quote,
        })),
        corrections: changedStaff.value.map((s) => ({
          staffId: s.staffId,
          name: s.name,
          titleBefore: s.titleBefore,
          titleAfter: s.title,
          departmentsBefore: s.departmentsBefore,
          departmentsAfter: s.departments,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Submission failed (${res.status})`);
    result.value = { identified: data.identified ?? 0, changed: data.changed ?? 0 };
    submitted.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="intake">
    <div class="intake__inner">
      <div class="intake__banner">
        <p class="intake__banner-label">Internal — temporary</p>
        <h2 class="intake__heading">{{ section?.heading || 'Help us fill in the staff page' }}</h2>
        <p class="intake__intro">
          {{ section?.intro || 'Identify the photos below and correct anyone whose title or department is wrong. Nothing here changes the website — the answers are emailed for review.' }}
        </p>
      </div>

      <div v-if="submitted" class="intake__done" role="status">
        <h3>Thank you — that’s been sent.</h3>
        <p>
          {{ result?.identified }} photo{{ result?.identified === 1 ? '' : 's' }} identified and
          {{ result?.changed }} staff record{{ result?.changed === 1 ? '' : 's' }} corrected.
        </p>
      </div>

      <template v-else>
        <p v-if="loading" class="intake__state">Loading…</p>
        <p v-else-if="loadError" class="intake__state intake__state--error">{{ loadError }}</p>

        <template v-else>
          <!-- ── Unidentified photos ── -->
          <h3 class="intake__section-title">
            Who is this? <span class="intake__count">{{ photos.length }} photo{{ photos.length === 1 ? '' : 's' }}</span>
          </h3>
          <p class="intake__hint">
            Leave any photo blank if you don’t know. The code under each picture is how we match
            your answers back to the right image — no need to write it down.
          </p>

          <div class="intake__photos">
            <div v-for="row in photos" :key="row.assetId" class="pcard">
              <div class="pcard__media">
                <img :src="`${row.imageUrl}?w=360&h=360&fit=crop&auto=format`" :alt="row.designation" loading="lazy" />
                <p class="pcard__designation">{{ row.designation }}</p>
                <p v-if="row.filename" class="pcard__filename">{{ row.filename }}</p>
              </div>

              <div class="pcard__fields">
                <label class="fld">
                  <span>Name</span>
                  <input v-model="row.name" type="text" autocomplete="off" />
                </label>
                <label class="fld">
                  <span>Title</span>
                  <input v-model="row.title" type="text" autocomplete="off" />
                </label>
                <fieldset class="fld fld--depts">
                  <legend>Department</legend>
                  <label v-for="d in departmentOptions" :key="d.value" class="chk">
                    <input
                      type="checkbox"
                      :checked="row.departments.includes(d.value)"
                      @change="toggleDept(row, d.value)"
                    />
                    <span>{{ d.label }}</span>
                  </label>
                </fieldset>
                <label class="fld">
                  <span>Favorite quote <em>(optional)</em></span>
                  <textarea v-model="row.quote" rows="2"></textarea>
                </label>
              </div>
            </div>
          </div>

          <!-- ── Existing staff ── -->
          <h3 class="intake__section-title intake__section-title--spaced">
            Check these details <span class="intake__count">{{ staff.length }} on the site</span>
          </h3>
          <p class="intake__hint">
            Pre-filled from the website. Change anything that’s wrong — untouched rows aren’t sent.
          </p>

          <div class="intake__staff">
            <div v-for="row in staff" :key="row.staffId" class="scard">
              <p class="scard__name">{{ row.name }}</p>
              <label class="fld">
                <span>Title</span>
                <input v-model="row.title" type="text" autocomplete="off" />
              </label>
              <fieldset class="fld fld--depts">
                <legend>Department</legend>
                <label v-for="d in departmentOptions" :key="d.value" class="chk">
                  <input
                    type="checkbox"
                    :checked="row.departments.includes(d.value)"
                    @change="toggleDept(row, d.value)"
                  />
                  <span>{{ d.label }}</span>
                </label>
              </fieldset>
            </div>
          </div>

          <!-- ── Submit ── -->
          <div class="intake__submit">
            <label class="fld fld--who">
              <span>Your name or email <em>(optional)</em></span>
              <input v-model="submittedBy" type="text" autocomplete="off" placeholder="So we know who to thank" />
            </label>

            <input
              v-model="gotcha"
              type="text"
              name="_gotcha"
              tabindex="-1"
              autocomplete="off"
              class="honeypot"
              aria-hidden="true"
            />

            <p class="intake__tally">
              {{ filledPhotos.length }} photo{{ filledPhotos.length === 1 ? '' : 's' }} filled in ·
              {{ changedStaff.length }} detail{{ changedStaff.length === 1 ? '' : 's' }} changed
            </p>

            <p v-if="submitError" class="intake__error" role="alert">{{ submitError }}</p>

            <button
              type="button"
              class="btn-primary intake__button"
              :disabled="submitting || !hasSomethingToSend"
              @click="submit"
            >
              {{ submitting ? 'Sending…' : 'Submit answers' }}
            </button>
          </div>
        </template>
      </template>
    </div>
  </section>
</template>

<style scoped>
.intake {
  padding: 3rem 1.5rem 4rem;
  background: var(--color-bg-secondary, #f5f1e8);
  border-top: 3px solid var(--jc-gold);
}
.intake__inner { max-width: 1100px; margin: 0 auto; }

.intake__banner { margin-bottom: 2.5rem; }
.intake__banner-label {
  display: inline-block;
  background: var(--jc-gold);
  color: #fff;
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border-radius: 3px;
  margin: 0 0 0.75rem;
}
.intake__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}
.intake__intro,
.intake__hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0 0 1.5rem;
  max-width: 62ch;
}

.intake__section-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.35rem;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.intake__section-title--spaced { margin-top: 3.5rem; }
.intake__count {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.intake__photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}
.pcard {
  display: flex;
  gap: 1rem;
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  padding: 1rem;
}
.pcard__media { flex: 0 0 120px; }
.pcard__media img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 0.5rem;
  display: block;
  background: var(--color-bg-subtle, #e8ede7);
}
.pcard__designation {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--jc-deep-green);
  margin: 0.5rem 0 0;
  text-align: center;
}
.pcard__filename {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin: 0.15rem 0 0;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
}
.pcard__fields { flex: 1; min-width: 0; }

.intake__staff {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}
.scard {
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  padding: 1rem;
}
.scard__name {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

.fld { display: block; margin-bottom: 0.75rem; }
.fld > span,
.fld legend {
  display: block;
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.3rem;
  padding: 0;
}
.fld em { text-transform: none; letter-spacing: 0; font-weight: 400; }
.fld input[type='text'],
.fld textarea {
  width: 100%;
  padding: 0.5rem 0.65rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: 0.375rem;
}
.fld input[type='text']:focus,
.fld textarea:focus {
  outline: 2px solid var(--jc-deep-green);
  outline-offset: 1px;
  border-color: transparent;
}
.fld--depts { border: none; margin: 0 0 0.75rem; padding: 0; }
.chk {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--text-xs);
  color: var(--color-text);
  margin: 0 0.65rem 0.3rem 0;
  cursor: pointer;
}

.intake__submit {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 2px solid var(--color-border, #e0d8c5);
  max-width: 480px;
}
.fld--who { max-width: 340px; }
.intake__tally {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 0.75rem;
}
.intake__button { width: 100%; }
.intake__button:disabled { opacity: 0.55; cursor: not-allowed; }

.intake__state { color: var(--color-text-muted); padding: 2rem 0; }
.intake__state--error { color: #8a1f1f; }
.intake__error {
  background: #fff4f4;
  border: 1px solid #f5c2c2;
  color: #8a1f1f;
  padding: 0.6rem 0.9rem;
  border-radius: 0.375rem;
  font-size: var(--text-sm);
  margin: 0 0 0.75rem;
}
.intake__done {
  background: var(--color-bg, #fff);
  border: 2px solid var(--jc-gold);
  border-radius: var(--radius-card, 0.75rem);
  padding: 2rem;
  text-align: center;
}
.intake__done h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  margin: 0 0 0.5rem;
  color: var(--color-text);
}
.intake__done p { margin: 0; color: var(--color-text-muted); }

.honeypot { display: none; }

@media (max-width: 520px) {
  .pcard { flex-direction: column; }
  .pcard__media { flex: none; }
  .pcard__media img { width: 100%; height: 200px; }
}
</style>
