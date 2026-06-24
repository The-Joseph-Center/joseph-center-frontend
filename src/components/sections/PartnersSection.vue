<script setup lang="ts">
import { computed } from 'vue';
import DiagonalSection from '@/components/sections/DiagonalSection.vue';
import { sanityImage } from '@/composables/useSanityImage';
import type { SanityImageSource } from '@/types/site';

interface Partner {
  name: string;
  // CMS-driven entries carry a Sanity image object; the static fallbacks
  // below still use logoSrc. The template resolves either to a URL.
  logo?: SanityImageSource | null;
  logoSrc?: string;
  href?: string;
  // True when the partner's logo is white/light and needs a dark card
  // background to stay visible. Toggled per-partner in Sanity.
  darkBg?: boolean;
}

interface Section {
  title?: string;
  partners?: Partner[];
  bandColor?: 'gold' | 'green' | 'deep-green';
}

const props = defineProps<{ section?: Section }>();

// Local static fallback used only when the CMS array is empty/missing.
const defaultPartners: Partner[] = [
  { name: 'Mesa County Libraries',     logoSrc: '/images/partners/mcla.png',            href: '#' },
  { name: 'Colorado Crisis Services',  logoSrc: '/images/partners/colorado-crisis.png', href: '#' },
  { name: "St. Mary's Medical Center", logoSrc: '/images/partners/st-marys.png',        href: '#' },
  { name: 'KAFM',                      logoSrc: '/images/partners/kafm.png',            href: '#' },
];

const title     = computed(() => props.section?.title ?? 'Our Partners');
const bandColor = computed(() => props.section?.bandColor ?? 'gold');
const partners  = computed(() =>
  props.section?.partners && props.section.partners.length
    ? props.section.partners
    : defaultPartners
);

function partnerLogoUrl(partner: Partner): string {
  if (partner.logo) {
    try {
      // ignoreImageParams() strips any stored crop/hotspot rect, which
      // Sanity otherwise auto-applies (and which truncates partner logos
      // uploaded with their default rect). fit('max') preserves the
      // logo's native aspect ratio (logos vary widely — square, wide, tall).
      return sanityImage(partner.logo)
        .ignoreImageParams()
        .width(500)
        .height(200)
        .fit('max')
        .auto('format')
        .url();
    } catch {
      // fall through to logoSrc if the asset ref can't be resolved
    }
  }
  return partner.logoSrc ?? '';
}
</script>

<template>
  <DiagonalSection :title="title" :color="bandColor" :content-bg="'var(--color-bg-secondary)'">
    <div class="partners-marquee">
      <div
        v-if="partners.length"
        class="partners-marquee__outer"
        role="region"
        aria-label="Our partners"
      >
        <div class="partners-marquee__track">
          <!--
            Render the list twice so the second copy picks up exactly where
            the first leaves off — seamless loop. aria-hidden on the duplicate
            so screen readers only announce each partner once.
          -->
          <ul class="partners-marquee__list">
            <li
              v-for="partner in partners"
              :key="partner.name"
              class="partners-marquee__item"
            >
              <a
                :href="partner.href || '#'"
                target="_blank"
                rel="noopener noreferrer"
                :class="['partners-marquee__link', { 'partners-marquee__link--dark-bg': partner.darkBg }]"
                :aria-label="`Visit ${partner.name} (opens in new tab)`"
              >
                <img
                  v-if="partner.logo || partner.logoSrc"
                  :src="partnerLogoUrl(partner)"
                  :alt="partner.name"
                  class="partners-marquee__logo"
                  loading="lazy"
                />
                <span v-else class="partners-marquee__name-fallback">
                  {{ partner.name }}
                </span>
              </a>
            </li>
          </ul>

          <ul class="partners-marquee__list" aria-hidden="true">
            <li
              v-for="partner in partners"
              :key="`dup-${partner.name}`"
              class="partners-marquee__item"
            >
              <a
                :href="partner.href || '#'"
                target="_blank"
                rel="noopener noreferrer"
                :class="['partners-marquee__link', { 'partners-marquee__link--dark-bg': partner.darkBg }]"
                tabindex="-1"
              >
                <img
                  v-if="partner.logo || partner.logoSrc"
                  :src="partnerLogoUrl(partner)"
                  :alt="partner.name"
                  class="partners-marquee__logo"
                  loading="lazy"
                />
                <span v-else class="partners-marquee__name-fallback">
                  {{ partner.name }}
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="partners-marquee__empty">
        <p>Partner logos coming soon.</p>
      </div>
    </div>
  </DiagonalSection>
</template>

<style scoped>
/* Marquee container — overflow:hidden clips the duplicate as it scrolls off */
.partners-marquee {
  padding: 2rem 0;
  overflow: hidden;
}

/* Fade edges so logos don't hard-clip at the container boundary. */
.partners-marquee__outer {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 8%,
    black 92%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 8%,
    black 92%,
    transparent 100%
  );
}

/* Track holds both lists side-by-side. The keyframes scroll one full
   list width (-50%, since the track is two lists wide), so when the
   animation loops the duplicate occupies the original's position
   — no visual jump.
   Scroll duration: increase for more logos, decrease for fewer.
   4 logos: 45s | 8 logos: 35s | 12+ logos: 28s */
.partners-marquee__track {
  display: flex;
  width: max-content;
  animation: partners-scroll 45s linear infinite;
}

/* Pause on hover OR when any child element receives focus. */
.partners-marquee__outer:hover .partners-marquee__track,
.partners-marquee__outer:focus-within .partners-marquee__track {
  animation-play-state: paused;
}

@keyframes partners-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.partners-marquee__list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-shrink: 0;
}

.partners-marquee__item {
  flex-shrink: 0;
  padding: 0 3rem;
}

.partners-marquee__link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  opacity: 0.75;
  transition: opacity 200ms ease, transform 200ms ease;
  border-radius: var(--radius-sm);
}

.partners-marquee__outer:hover .partners-marquee__link:hover,
.partners-marquee__outer:focus-within .partners-marquee__link:focus {
  opacity: 1;
  transform: scale(1.06);
}

.partners-marquee__logo {
  height: 120px;
  width: auto;
  max-width: 320px;
  object-fit: contain;
  display: block;
  filter: grayscale(100%);
  transition: filter 200ms ease;
}

.partners-marquee__outer:hover .partners-marquee__link:hover .partners-marquee__logo,
.partners-marquee__outer:focus-within .partners-marquee__link:focus .partners-marquee__logo {
  filter: grayscale(0%);
}

/* Dark-background slot for white/light logos (e.g. Praise Him Ministries).
   Matches the existing carousel behavior: deep-green card, no greyscale,
   and a tighter image clamp so the visible card stays the same total
   height as the transparent partner slots. */
.partners-marquee__link--dark-bg {
  background: var(--jc-deep-green);
  border-radius: var(--radius-card, 0.5rem);
  padding: 0.5rem 1rem;
  opacity: 1;
}
.partners-marquee__link--dark-bg .partners-marquee__logo {
  filter: none;
  height: 104px;
}
.partners-marquee__outer:hover .partners-marquee__link--dark-bg:hover,
.partners-marquee__outer:focus-within .partners-marquee__link--dark-bg:focus {
  opacity: 1;
  transform: scale(1.04);
}

.partners-marquee__name-fallback {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
  letter-spacing: 0.04em;
}

.partners-marquee__empty {
  padding: 2rem 0;
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
}

/* Reduced motion — static centered grid instead of continuous scroll.
   Drops the duplicate list, removes the edge fade, full color, full opacity. */
@media (prefers-reduced-motion: reduce) {
  .partners-marquee__track {
    animation: none;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
  }
  .partners-marquee__list:last-child { display: none; }
  .partners-marquee__list {
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    gap: 2rem;
  }
  .partners-marquee__item { padding: 0; }
  .partners-marquee__outer {
    -webkit-mask-image: none;
    mask-image: none;
  }
  .partners-marquee__logo { filter: grayscale(0%); }
  .partners-marquee__link { opacity: 1; }
}
</style>
