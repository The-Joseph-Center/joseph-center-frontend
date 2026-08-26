<script setup lang="ts">
import { computed, ref } from 'vue';
import { sanityImage } from '@/composables/useSanityImage';
import SmartLink from '@/components/ui/SmartLink.vue';
import type { SanityImageSource } from '@/types/site';

interface Person {
  _id?: string;
  name?: string;
  title?: string;
  email?: string | null;
  image?: SanityImageSource | null;
  source?: string | null;
  quote?: string | null;
  isAdvisoryBoard?: boolean;
}

// ── TEMPORARY: inline edit mode ──────────────────────────────────────────
// Lets a manager correct a card in place on /staff rather than hunting for a
// matching row in a separate form. Off by default, so the live card renders
// exactly as it always has.
//   'partial' — title + department only (named staff, where those are the
//               questionable fields)
//   'full'    — also name and email (the joseph_N placeholder cards, which
//               need identifying outright)
// The parent owns the draft object and mutates it directly; this component
// only renders the inputs. Delete this block, the `draft`/`editMode` props and
// the .person-card--editing styles when the intake is done.
export interface StaffDraft {
  name: string;
  title: string;
  department: string;
  departmentOther: string;
  email: string;
}

const props = withDefaults(
  defineProps<{
    person: Person;
    showContact?: boolean;
    editMode?: 'off' | 'partial' | 'full';
    draft?: StaffDraft | null;
    departmentOptions?: { value: string; label: string }[];
    // Off when the cards already sit under an "Advisory Board" heading, which
    // would otherwise repeat the same words on every card in the section.
    showAdvisoryLabel?: boolean;
  }>(),
  { editMode: 'off', draft: null, departmentOptions: () => [], showAdvisoryLabel: true }
);

const editing = computed(() => props.editMode !== 'off' && !!props.draft);
const editingFull = computed(() => editing.value && props.editMode === 'full');

const photoUrl = computed(() => {
  if (!props.person.image) return null;
  try {
    return sanityImage(props.person.image).width(600).height(600).fit('crop').auto('format').url();
  } catch {
    return null;
  }
});

// Asset references from another dataset (e.g. copied production → staging) can
// resolve to a URL that 404s. Track load state and fall back to the placeholder.
const imageBroken = ref(false);
const showImage = computed(() => !!photoUrl.value && !imageBroken.value);

// No photo at all → drop the square entirely so the card collapses to its text
// rather than showing a large empty panel. A photo that is set but fails to
// load still falls back to the initial placeholder, so a genuine broken asset
// stays visible as a problem instead of quietly disappearing.
const hasPhoto = computed(() => !!photoUrl.value);

const contactHref = computed(() => {
  if (props.showContact === false) return null;
  const e = props.person.email?.trim();
  return e ? `mailto:${e}` : null;
});

const firstName = computed(() => (props.person.name || '').split(' ')[0] || 'us');
</script>

<template>
  <div class="person-card">
    <div v-if="hasPhoto" class="person-card__photo-wrap">
      <img
        v-if="showImage"
        :src="photoUrl!"
        :alt="person.name || 'Staff member'"
        class="person-card__photo"
        loading="lazy"
        @error="imageBroken = true"
      />
      <div v-else class="person-card__photo-placeholder" aria-hidden="true">
        <span class="person-card__photo-initial">{{ (person.name || '?').charAt(0).toUpperCase() }}</span>
      </div>
    </div>

    <div class="person-card__banner">
      <!-- Editing: the name sits where the name always sits -->
      <template v-if="editing">
        <input
          v-if="editingFull"
          v-model="draft!.name"
          type="text"
          class="pc-edit__input pc-edit__input--name"
          aria-label="Name"
          placeholder="Name"
        />
        <p v-else class="person-card__name">{{ person.name || 'Unnamed' }}</p>

        <input
          v-model="draft!.title"
          type="text"
          class="pc-edit__input"
          aria-label="Title"
          placeholder="Title"
        />
      </template>

      <template v-else>
        <p class="person-card__name">{{ person.name || 'Unnamed' }}</p>
        <p v-if="person.title" class="person-card__role">{{ person.title }}</p>
      </template>
    </div>

    <!-- Editing: the intake fields sit ALONGSIDE the quote, not in place of it.
         They originally replaced it, which meant no quote rendered anywhere on
         the staff page while intake mode was on — invisible until the first
         quote existed, then wrong sitewide. The quote is not editable here
         either way: staff set it from the dashboard. -->
    <div v-if="editing" class="person-card__bottom pc-edit">
      <label class="pc-edit__field">
        <span class="pc-edit__label">Department</span>
        <select v-model="draft!.department" class="pc-edit__input">
          <option value="">Select…</option>
          <option v-for="d in departmentOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
          <option value="__other">Other…</option>
        </select>
      </label>

      <input
        v-if="draft!.department === '__other'"
        v-model="draft!.departmentOther"
        type="text"
        class="pc-edit__input"
        aria-label="Other department"
        placeholder="Type the department"
      />

      <label v-if="editingFull" class="pc-edit__field">
        <span class="pc-edit__label">Email</span>
        <input
          v-model="draft!.email"
          type="email"
          class="pc-edit__input"
          autocomplete="off"
          placeholder="name@josephcentergj.com"
        />
      </label>

      <!-- Read-only: shows what the public sees, and is set from the dashboard. -->
      <p v-if="person.quote" class="person-card__quote pc-edit__quote">
        &ldquo;{{ person.quote }}&rdquo;
      </p>
    </div>

    <div v-else class="person-card__bottom">
      <!-- Quote takes precedence over the contact link when set -->
      <p v-if="person.quote" class="person-card__quote">
        &ldquo;{{ person.quote }}&rdquo;
      </p>
      <SmartLink
        v-else-if="contactHref"
        :to="contactHref"
        class="person-card__contact-link"
      >
        Contact {{ firstName }} →
      </SmartLink>

      <!-- Advisory board label (board members only) -->
      <span v-if="person.isAdvisoryBoard && showAdvisoryLabel" class="person-card__advisory">
        Advisory Board Member
      </span>
    </div>
  </div>
</template>

<style scoped>
.person-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  background: white;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.08));
  transition: box-shadow 200ms ease, transform 200ms ease;
}

/* ── TEMPORARY: inline edit mode ── */
.pc-edit {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
}
.pc-edit__field { display: block; }
.pc-edit__label {
  display: block;
  font-family: var(--font-heading);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.15rem;
}
.pc-edit__input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--color-text);
  background: #fff;
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: 0.3rem;
}
.pc-edit__input--name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.95rem;
}
.pc-edit__quote {
  margin-top: 0.15rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border, #e0d8c5);
}

.pc-edit__input:focus {
  outline: 2px solid var(--jc-deep-green);
  outline-offset: 1px;
  border-color: transparent;
}

.person-card:hover {
  box-shadow: var(--shadow-card-hover, 0 6px 18px rgba(0, 0, 0, 0.12));
  transform: translateY(-2px);
}

.person-card__photo-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--color-bg-subtle, #f4f1ea);
}

.person-card__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}

.person-card__photo-placeholder {
  width: 100%;
  height: 100%;
  background: var(--jc-deep-green);
  opacity: 0.85;
  display: flex;
  align-items: center;
  justify-content: center;
}

.person-card__photo-initial {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.02em;
}

.person-card__banner {
  background: var(--jc-gold);
  padding: 0.65rem 0.85rem 0.55rem;
}

.person-card__name {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: white;
  margin: 0 0 0.15rem;
  line-height: 1.3;
}

.person-card__role {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
  line-height: 1.3;
}

.person-card__bottom {
  padding: 0.65rem 0.85rem;
  min-height: 2.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
}

.person-card__contact-link {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 150ms ease;
}

.person-card__contact-link:hover {
  color: var(--jc-deep-green);
  text-decoration: underline;
}

.person-card__quote {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-style: italic;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
  /* Clamp to 3 lines so cards stay consistent height */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.person-card__advisory {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--jc-gold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
