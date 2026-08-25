<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import PersonCard from '@/components/ui/PersonCard.vue';
import { useSanity } from '@/composables/useSanity';
import { DEPARTMENTS, departmentLabel } from '@/lib/departments';
import type { SanityImageSource } from '@/types/site';

interface Section {
  source?: 'staff' | 'board';
  showContact?: boolean;
  groupByDepartment?: boolean;
  // TEMPORARY — turns the cards into editable forms. Remove with the intake.
  intakeMode?: boolean;
}

interface Person {
  _id: string;
  name?: string;
  title?: string;
  email?: string | null;
  image?: SanityImageSource | null;
  source?: string | null;
  quote?: string | null;
  isAdvisoryBoard?: boolean;
  departments?: string[] | null;
  imageUrl?: string | null;
}

const props = defineProps<{ section?: Section | null }>();

const sourceType = computed<'staff' | 'board'>(
  () => props.section?.source || 'staff'
);
const showContact = computed(() => props.section?.showContact !== false);

// Staff are grouped under department headings; board members have no
// departments, so /board keeps the flat grid. Editors can switch grouping off
// per-section without a code change.
const grouped = computed(
  () => sourceType.value === 'staff' && props.section?.groupByDepartment !== false
);

// useSanity fires once on mount. The two pages (/staff, /board) are separate
// mounts of this component, so a single query per mount is enough.
// `hidden != true` also matches documents with no `hidden` field at all, so
// existing people stay visible without needing a backfill.
const query = `*[_type == $source && hidden != true] | order(name asc){
  _id, name, title, email, image, source, quote, isAdvisoryBoard, departments,
  "imageUrl": image.asset->url
}`;

const { data: people, loading } = useSanity<Person[]>(query, {
  source: sourceType.value,
});

interface Group {
  key: string;
  label: string;
  people: Person[];
}

// Departments render in the canonical order from @/lib/departments, not
// alphabetically, so the org chart reads the way JC describes it.
//
// Two deliberate omissions:
//  • 'unknown' is an internal triage bucket — "Unknown / Needs Review" must
//    never appear as a public heading — so those people fall through to the
//    trailing group instead.
//  • Empty departments are skipped entirely rather than printing a bare
//    heading over nothing.
//
// Someone assigned to several departments appears under each of them, which is
// what a multi-select implies; the trailing group catches anyone left over.
const groups = computed<Group[]>(() => {
  const list = people.value ?? [];
  if (!grouped.value || !list.length) return [];

  const out: Group[] = [];
  const claimed = new Set<string>();

  for (const dept of DEPARTMENTS) {
    if (dept.value === 'unknown') continue;
    const members = list.filter((p) => p.departments?.includes(dept.value));
    if (!members.length) continue;
    members.forEach((m) => claimed.add(m._id));
    out.push({ key: dept.value, label: dept.label, people: members });
  }

  const rest = list.filter((p) => !claimed.has(p._id));
  if (rest.length) {
    // Only worth a heading of its own when there are real departments above it.
    out.push({ key: '__ungrouped', label: out.length ? 'Additional Staff' : 'Our Staff', people: rest });
  }

  return out;
});

// ─────────────────────────────────────────────────────────────────────────
// TEMPORARY — inline intake editing.
//
// Every card becomes editable in place, so a manager fixes the record in front
// of them instead of matching it against a separate form further down the page.
//
// Cards in the trailing group (the joseph_N placeholders, which carry only the
// 'unknown' department) get the full set of fields — they need identifying
// outright. Cards filed under a real department get title and department only,
// since those are the questionable parts.
//
// Nothing is written to Sanity; the answers are emailed for review.
// To switch off: untick "Intake mode" on the People Grid section in Studio.
// ─────────────────────────────────────────────────────────────────────────
interface Draft {
  name: string;
  title: string;
  department: string;
  departmentOther: string;
  email: string;
}

const intake = computed(
  () => sourceType.value === 'staff' && props.section?.intakeMode === true
);

const departmentOptions = DEPARTMENTS.map((d) => ({ value: d.value, label: d.label }));

const drafts = reactive<Record<string, Draft>>({});
// Ids in the trailing group get the full field set.
const fullEditIds = ref<Set<string>>(new Set());

function seedDrafts() {
  if (!intake.value) return;
  const list = people.value ?? [];
  const trailing = groups.value.find((g) => g.key === '__ungrouped');
  fullEditIds.value = new Set((trailing?.people ?? []).map((p) => p._id));

  for (const p of list) {
    const isPlaceholder = fullEditIds.value.has(p._id);
    const current = (p.departments ?? []).find((d) => d !== 'unknown') ?? '';
    drafts[p._id] = {
      name: p.name ?? '',
      // The placeholder cards start blank so a manager fills them fresh; named
      // staff are pre-filled from the CMS so only real edits stand out.
      title: isPlaceholder ? '' : (p.title ?? ''),
      department: isPlaceholder ? '' : current,
      departmentOther: '',
      email: isPlaceholder ? '' : (p.email ?? ''),
    };
  }
}
watch([people, intake], seedDrafts, { immediate: true });

function editModeFor(id: string): 'off' | 'partial' | 'full' {
  if (!intake.value) return 'off';
  return fullEditIds.value.has(id) ? 'full' : 'partial';
}

function resolvedDepartment(d: Draft): string {
  if (d.department === '__other') return d.departmentOther.trim();
  return d.department ? departmentLabel(d.department) : '';
}

const submittedBy = ref('');
const gotcha = ref('');
const submitting = ref(false);
const submitError = ref('');
const submitted = ref(false);

const edits = computed(() => {
  if (!intake.value) return [];
  return (people.value ?? [])
    .map((p) => {
      const d = drafts[p._id];
      if (!d) return null;
      const isPlaceholder = fullEditIds.value.has(p._id);
      const before = {
        name: p.name ?? '',
        title: p.title ?? '',
        department: (p.departments ?? []).map(departmentLabel).join(', '),
        email: p.email ?? '',
      };
      const after = {
        name: d.name.trim(),
        title: d.title.trim(),
        department: resolvedDepartment(d),
        email: d.email.trim(),
      };
      const changed =
        (isPlaceholder && (after.name !== before.name || after.title || after.department || after.email)) ||
        (!isPlaceholder &&
          (after.title !== before.title || (after.department && after.department !== before.department)));
      if (!changed) return null;
      return {
        staffId: p._id,
        currentName: p.name ?? '(unnamed)',
        imageUrl: p.imageUrl ?? null,
        kind: isPlaceholder ? 'identification' : 'correction',
        nameBefore: before.name, nameAfter: after.name,
        titleBefore: before.title, titleAfter: after.title,
        departmentBefore: before.department, departmentAfter: after.department,
        emailBefore: before.email, emailAfter: after.email,
      };
    })
    .filter(Boolean);
});

async function submitIntake() {
  if (!edits.value.length) {
    submitError.value = 'Nothing has been changed yet.';
    return;
  }
  submitting.value = true;
  submitError.value = '';
  try {
    const res = await fetch('/.netlify/functions/submit-staff-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submittedBy: submittedBy.value, _gotcha: gotcha.value, edits: edits.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Submission failed (${res.status})`);
    submitted.value = true;
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="people-grid">
    <div class="people-grid__inner">
      <!-- TEMPORARY — intake banner -->
      <div v-if="intake && !submitted" class="intake-note">
        <p class="intake-note__label">Internal — temporary</p>
        <p class="intake-note__text">
          Edit any card directly. Cards without a department need a name, title,
          department and email; the rest just need their title and department
          checked. Nothing here changes the live site — your answers are emailed
          for review.
        </p>
      </div>
      <div v-if="loading" class="people-grid__state">
        <p>Loading…</p>
      </div>

      <div v-else-if="!people?.length" class="people-grid__state">
        <p>No {{ sourceType === 'board' ? 'board members' : 'staff' }} to display yet.</p>
      </div>

      <!-- Grouped by department (staff) -->
      <template v-else-if="grouped">
        <section
          v-for="group in groups"
          :key="group.key"
          class="people-grid__dept"
        >
          <h2 class="people-grid__dept-title">{{ group.label }}</h2>
          <hr class="people-grid__rule" />
          <div class="people-grid__grid">
            <PersonCard
              v-for="person in group.people"
              :key="`${group.key}-${person._id}`"
              :person="person"
              :show-contact="showContact"
              :edit-mode="editModeFor(person._id)"
              :draft="drafts[person._id] ?? null"
              :department-options="departmentOptions"
            />
          </div>
        </section>
      </template>

      <!-- TEMPORARY — submit bar -->
      <div v-if="intake && submitted" class="intake-bar intake-bar--done" role="status">
        <p><strong>Thank you — that’s been sent.</strong> Your changes are on their way for review.</p>
      </div>

      <!-- Flat grid (board, or grouping switched off) -->
      <div v-else class="people-grid__grid">
        <PersonCard
          v-for="person in people"
          :key="person._id"
          :person="person"
          :show-contact="showContact"
          :edit-mode="editModeFor(person._id)"
          :draft="drafts[person._id] ?? null"
          :department-options="departmentOptions"
        />
      </div>
      <!-- TEMPORARY — sticky submit bar -->
      <div v-if="intake && !submitted && !loading" class="intake-bar">
        <div class="intake-bar__inner">
          <input
            v-model="submittedBy"
            type="text"
            class="intake-bar__who"
            placeholder="Your name (optional)"
            autocomplete="off"
          />
          <input
            v-model="gotcha"
            type="text"
            name="_gotcha"
            tabindex="-1"
            autocomplete="off"
            class="intake-bar__honeypot"
            aria-hidden="true"
          />
          <p class="intake-bar__tally">
            {{ edits.length }} card{{ edits.length === 1 ? '' : 's' }} edited
          </p>
          <button
            type="button"
            class="btn-primary intake-bar__submit"
            :disabled="submitting || !edits.length"
            @click="submitIntake"
          >
            {{ submitting ? 'Sending…' : 'Submit changes' }}
          </button>
        </div>
        <p v-if="submitError" class="intake-bar__error" role="alert">{{ submitError }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── TEMPORARY: intake mode chrome ── */
.intake-note {
  background: var(--color-bg-secondary, #f5f1e8);
  border-left: 4px solid var(--jc-gold);
  border-radius: 0.4rem;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
}
.intake-note__label {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--jc-gold);
  margin: 0 0 0.35rem;
}
.intake-note__text {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text-muted);
  max-width: 68ch;
}

.intake-bar {
  position: sticky;
  bottom: 0;
  z-index: 50;
  margin-top: 2.5rem;
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  padding: 1rem 1.25rem;
}
.intake-bar__inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.intake-bar__who {
  flex: 1 1 200px;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  font-size: var(--text-sm);
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: 0.3rem;
  background: #fff;
  color: var(--color-text);
}
.intake-bar__tally {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}
.intake-bar__submit { flex: 0 0 auto; }
.intake-bar__submit:disabled { opacity: 0.55; cursor: not-allowed; }
.intake-bar__honeypot { display: none; }
.intake-bar__error {
  margin: 0.75rem 0 0;
  font-size: var(--text-sm);
  color: #8a1f1f;
}
.intake-bar--done {
  position: static;
  border-color: var(--jc-gold);
  text-align: center;
}
.intake-bar--done p { margin: 0; color: var(--color-text); }

.people-grid {
  padding: 2rem 1.5rem 4rem;
  background: var(--color-bg);
}

.people-grid__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.people-grid__state {
  text-align: center;
  color: var(--color-text-muted);
  padding: 3rem 0;
}

.people-grid__dept + .people-grid__dept {
  margin-top: 3.5rem;
}

.people-grid__dept-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0 0 0.75rem;
}

.people-grid__rule {
  border: none;
  border-top: 2px solid var(--jc-gold);
  margin: 0 0 2rem;
}

.people-grid__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .people-grid__grid {
    gap: 2rem;
  }
}

@media (max-width: 480px) {
  .people-grid__grid {
    grid-template-columns: 1fr;
  }
}
</style>
