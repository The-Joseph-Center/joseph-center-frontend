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

const props = defineProps<{
  person: Person;
  showContact?: boolean;
}>();

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

const contactHref = computed(() => {
  if (props.showContact === false) return null;
  const e = props.person.email?.trim();
  return e ? `mailto:${e}` : null;
});

const firstName = computed(() => (props.person.name || '').split(' ')[0] || 'us');
</script>

<template>
  <div class="person-card">
    <div class="person-card__photo-wrap">
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
      <span v-if="person.isAdvisoryBoard" class="person-card__advisory">
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
