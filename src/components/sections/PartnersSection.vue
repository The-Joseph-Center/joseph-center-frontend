<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
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

// Explicit user pause state. Composes with the existing hover/focus-within
// pause: hover still pauses transiently, but `isPaused` is the persistent
// signal that an explicit pause button provides — required for WCAG 2.2.2
// since hover-to-pause isn't reachable for touch users.
const isPaused = ref(false);
function togglePaused() {
  isPaused.value = !isPaused.value;
}

// Pixel-precise loop: measure the first list's offsetWidth (always an
// integer) and translate by exactly that many pixels per cycle. A %-based
// translate of a track whose total width includes non-integer logo widths
// (logos use width: auto from images) lands on a fractional pixel, and the
// snap-back to 0 on each loop exposes that fraction as a visible hitch.
const trackRef = ref<HTMLElement | null>(null);
const firstListRef = ref<HTMLElement | null>(null);
const listWidth = ref(0);

function measure() {
  if (!firstListRef.value || !trackRef.value) return;
  const w = firstListRef.value.offsetWidth;
  // Skip writes that would jolt the in-flight animation. The list naturally
  // settles to a stable width after fonts/images load; we only need the
  // final integer.
  if (w && w !== listWidth.value) {
    listWidth.value = w;
    trackRef.value.style.setProperty('--list-width', `${w}px`);
  }
}

let ro: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();
  measure();
  // Logos are loaded async — re-measure each time one finishes so the final
  // width matches the post-load layout, not the pre-load placeholder layout.
  firstListRef.value?.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', measure, { once: true });
  });
  if (typeof ResizeObserver !== 'undefined' && firstListRef.value) {
    ro = new ResizeObserver(() => measure());
    ro.observe(firstListRef.value);
  } else {
    window.addEventListener('resize', measure);
  }
});
onBeforeUnmount(() => {
  ro?.disconnect();
  window.removeEventListener('resize', measure);
});

// Re-measure if the partners array changes (CMS edits with HMR, etc).
watch(partners, async () => {
  await nextTick();
  measure();
});

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
      <!-- WCAG 2.2.2 pause control. Lives OUTSIDE the masked __outer
           container so the edge fade doesn't tint the button. Reachable
           by touch, mouse, and keyboard; state announced via aria-pressed. -->
      <button
        v-if="partners.length"
        type="button"
        class="partners-marquee__pause"
        :aria-pressed="isPaused"
        :aria-label="isPaused ? 'Resume partner logo scrolling' : 'Pause partner logo scrolling'"
        @click="togglePaused"
      >
        <svg v-if="isPaused" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M3 2.5 13 8 3 13.5z" fill="currentColor" />
        </svg>
        <svg v-else viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <rect x="3.5" y="2.5" width="3" height="11" fill="currentColor" />
          <rect x="9.5" y="2.5" width="3" height="11" fill="currentColor" />
        </svg>
      </button>

      <div
        v-if="partners.length"
        :class="['partners-marquee__outer', { 'is-paused': isPaused }]"
        role="region"
        aria-label="Our partners"
      >
        <div ref="trackRef" class="partners-marquee__track">
          <!--
            Render the list twice so the second copy picks up exactly where
            the first leaves off — seamless loop. aria-hidden on the duplicate
            so screen readers only announce each partner once.
          -->
          <ul ref="firstListRef" class="partners-marquee__list">
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
/* Marquee container — overflow:hidden clips the duplicate as it scrolls off.
   Relative positioning anchors the absolute-positioned pause control. */
.partners-marquee {
  position: relative;
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

/* Pause control — small circular button anchored top-right of the
   marquee container. Lives as a SIBLING of __outer (not a child) so
   the parent's edge mask doesn't tint it. */
.partners-marquee__pause {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--jc-deep-green);
  background: white;
  color: var(--jc-deep-green);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 150ms ease, color 150ms ease, transform 150ms ease;
}
.partners-marquee__pause:hover,
.partners-marquee__pause:focus-visible {
  background: var(--jc-deep-green);
  color: white;
  transform: scale(1.05);
  outline: none;
}
.partners-marquee__pause:focus-visible {
  box-shadow: 0 0 0 3px rgba(29, 95, 85, 0.3);
}

/* Track holds both lists side-by-side. The keyframes scroll one full
   list width (-50%, since the track is two lists wide), so when the
   animation loops the duplicate occupies the original's position
   — no visual jump.
   Scroll duration: increase for more logos, decrease for fewer.
   4 logos: 55s | 8 logos: 42s | 12+ logos: 34s
   Bumped from 45s when logo height doubled (60->120px); larger items
   moving at the same px/s read as faster, so we slow the loop. */
.partners-marquee__track {
  display: flex;
  width: max-content;
  /* Force the track onto its own GPU layer so the browser composites the
     scroll without rasterizing on the main thread. Combined with translate3d
     in the keyframes, this removes the subpixel jump some browsers show at
     the loop boundary when list widths aren't integer pixels (logos use
     width: auto, which produces non-integer totals). */
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  animation: partners-scroll 55s linear infinite;
}

/* Pause on hover, on focus-within, or while explicitly paused via the
   visible pause button (is-paused class). focus-within keeps keyboard
   users from losing scroll position as they tab to a logo. */
.partners-marquee__outer:hover .partners-marquee__track,
.partners-marquee__outer:focus-within .partners-marquee__track,
.partners-marquee__outer.is-paused .partners-marquee__track {
  animation-play-state: paused;
}

@keyframes partners-scroll {
  from { transform: translate3d(0, 0, 0); }
  /* --list-width is set in px by JS after measuring the first list. The
     fallback -50% covers SSR / pre-measurement frames; once JS has run, the
     translate is exactly the list's integer pixel width, so the snap from
     the end of one iteration back to 0 lines up exactly with the duplicate. */
  to   { transform: translate3d(calc(-1 * var(--list-width, 50%)), 0, 0); }
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
  /* No animation to control — hide the pause button. */
  .partners-marquee__pause { display: none; }
}
</style>
