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
  quoteSource?: string | null;
  isAdvisoryBoard?: boolean;
}

const props = withDefaults(
  defineProps<{
    person: Person;
    showContact?: boolean;
    // Off when the cards already sit under an "Advisory Board" heading, which
    // would otherwise repeat the same words on every card in the section.
    showAdvisoryLabel?: boolean;
  }>(),
  { showAdvisoryLabel: true }
);

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

// The card supplies its own curly quotes, so a quote pasted with marks already
// around it rendered as ““like this””. Stripping them here means the display is
// right whatever anyone types, rather than relying on everyone typing it the
// same way.
const quoteText = computed(() =>
  (props.person.quote || '').trim().replace(/^["“”']+/, '').replace(/["“”']+$/, '').trim()
);
const quoteSource = computed(() => (props.person.quoteSource || '').trim());
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
      <p class="person-card__name">{{ person.name || 'Unnamed' }}</p>
      <p v-if="person.title" class="person-card__role">{{ person.title }}</p>
    </div>

    <div class="person-card__bottom">
      <!-- Both, where both exist. These used to be mutually exclusive, so
           adding a quote silently removed someone's contact link — they serve
           different purposes and there is no reason to trade one for the other.
           The bottom section already stacks and grows, so it just gets taller. -->
      <blockquote v-if="quoteText" class="person-card__quote">
        <span class="person-card__quote-text">&ldquo;{{ quoteText }}&rdquo;</span>
        <cite v-if="quoteSource" class="person-card__quote-source">&mdash; {{ quoteSource }}</cite>
      </blockquote>
      <SmartLink
        v-if="contactHref"
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

.person-card__quote-source {
  display: block;
  margin-top: 0.15rem;
  font-style: normal;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.person-card__quote {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-style: italic;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
  margin: 0;
  padding: 0;
}

/* The 3-line clamp that keeps cards a consistent height sits on the quote text
   alone. Clamping the whole blockquote would drop the attribution on a longer
   quote, and the name is the part you cannot lose. */
.person-card__quote-text {
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
