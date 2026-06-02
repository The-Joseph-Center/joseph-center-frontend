<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
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

const currentIndex = ref(0);
const visibleCount = ref(4);

function updateVisible() {
  visibleCount.value = window.innerWidth >= 768 ? 4 : 2;
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + partners.value.length) % partners.value.length;
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % partners.value.length;
}

const visiblePartners = computed(() => {
  const list = partners.value;
  if (!list.length) return [] as Partner[];
  const out: Partner[] = [];
  for (let i = 0; i < Math.min(visibleCount.value, list.length); i++) {
    const item = list[(currentIndex.value + i) % list.length];
    if (item) out.push(item);
  }
  return out;
});

onMounted(() => {
  updateVisible();
  window.addEventListener('resize', updateVisible);
});
onBeforeUnmount(() => window.removeEventListener('resize', updateVisible));
</script>

<template>
  <DiagonalSection :title="title" :color="bandColor" :content-bg="'var(--color-bg-secondary)'">
    <div class="partners">
      <button class="partners__nav partners__nav--prev" @click="prev" aria-label="Previous partners">
        <span aria-hidden="true">◁</span>
      </button>

      <div class="partners__track" role="list">
        <a
          v-for="partner in visiblePartners"
          :key="partner.name"
          :href="partner.href || '#'"
          target="_blank"
          rel="noopener noreferrer"
          class="partners__logo"
          :aria-label="partner.name"
          role="listitem"
        >
          <img :src="partnerLogoUrl(partner)" :alt="partner.name" loading="lazy" />
        </a>
      </div>

      <button class="partners__nav partners__nav--next" @click="next" aria-label="Next partners">
        <span aria-hidden="true">▷</span>
      </button>
    </div>
  </DiagonalSection>
</template>

<style scoped>
.partners {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.partners__track {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(var(--visible-count, 4), 1fr);
  gap: 2.5rem;
  align-items: center;
  justify-items: center;
}

@media (max-width: 767px) {
  .partners__track {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

.partners__logo {
  /* Slot is purely a click target + filter wrapper. No fixed dimensions on
     the slot itself — let the image determine height. */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
  filter: grayscale(1);
  opacity: 0.85;
  transition: filter 200ms ease, opacity 200ms ease;
}

.partners__logo img {
  /* Use max-* so aspect is ALWAYS preserved. With fixed height + max-width,
     extra-wide logos would have their width clamped but height held at
     100px, producing horizontal squish. max-height + max-width lets the
     browser scale uniformly when either bound is hit. */
  max-height: 100px;
  max-width: 100%;
  width: auto;
  height: auto;
  display: block;
}

.partners__logo:hover {
  filter: grayscale(0);
  opacity: 1;
}

.partners__nav {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--jc-gold);
  background: white;
  color: var(--jc-gold);
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease, color 150ms ease;
  flex-shrink: 0;
}

.partners__nav:hover {
  background: var(--jc-gold);
  color: white;
}
</style>
