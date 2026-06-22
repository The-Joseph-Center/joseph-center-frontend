<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSiteStore } from '@/stores/useSiteStore';
import SmartLink from '@/components/ui/SmartLink.vue';
import SiteAmbience from '@/components/layout/SiteAmbience.vue';
import SiteBanner from '@/components/layout/SiteBanner.vue';
import { sanityImage } from '@/composables/useSanityImage';

const props = defineProps({ section: { type: Object, default: null } });
const site = useSiteStore();
const heroRef = ref(null);

function onHeroMouseMove(e) {
  const rect = heroRef.value.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  heroRef.value.style.setProperty('--cursor-x', `${x}%`);
  heroRef.value.style.setProperty('--cursor-y', `${y}%`);
}

const heroStyle = computed(() => {
  const img = props.section?.image;
  const minHeight = props.section?.minHeight || '480px';
  const base = { minHeight };
  if (!img) return base;
  const url = sanityImage(img).width(1920).auto('format').url();
  const x = (img.hotspot?.x ?? 0.5) * 100;
  const y = (img.hotspot?.y ?? 0.5) * 100;
  return {
    ...base,
    '--hero-image': `url(${url})`,
    '--hero-position': `${x}% ${y}%`,
  };
});

const align = computed(() => props.section?.align || 'center');

const flexClasses = computed(() => {
  switch (align.value) {
    case 'right': return 'items-end justify-end';
    case 'left':  return 'items-end justify-start';
    default:      return 'items-center justify-center';
  }
});

const textClasses = computed(() => {
  switch (align.value) {
    case 'right': return 'text-right';
    case 'left':  return 'text-left';
    default:      return 'text-center translate-y-8';
  }
});

// Stripe defaults to true; can be disabled per-section via section.showStripe = false
const showStripe = computed(() => props.section?.showStripe !== false);
const stripeColor = computed(() => props.section?.stripeColor || 'gold');

onMounted(() => { heroRef.value?.addEventListener('mousemove', onHeroMouseMove); });
onUnmounted(() => { heroRef.value?.removeEventListener('mousemove', onHeroMouseMove); });
</script>

<template>
  <section
    ref="heroRef"
    class="hero relative flex px-6 py-24 overflow-hidden"
    :class="flexClasses"
    :style="heroStyle"
    :aria-label="section?.imageAlt || undefined"
  >
    <SiteAmbience variant="hero" />
    <div class="relative z-10 text-white max-w-3xl" :class="textClasses">
      <h1 v-if="section?.title || site.name" class="text-5xl font-extrabold leading-tight mb-4 text-white whitespace-pre-line">{{ section?.title || site.name }}</h1>
      <p v-if="section?.subtitle || site.tagline" class="hero__subtitle">{{ section?.subtitle || site.tagline }}</p>
      <SmartLink v-if="section?.cta?.label && section?.cta?.url" :to="section.cta.url" class="focus-ring-light inline-block border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-[var(--color-primary)] transition-colors">{{ section.cta.label }}</SmartLink>
    </div>
    <div v-if="showStripe" class="hero-stripe" :class="`hero-stripe--${stripeColor}`" aria-hidden="true"></div>
  </section>
  <!-- Site-wide announcement banner sits directly under the hero on every
       page that has one. It self-hides when no active banner doc exists. -->
  <SiteBanner />
</template>

<style scoped>
.hero {
  --cursor-x: 50%;
  --cursor-y: 40%;
  /* Note: Brave/Edge can render the `transparent` keyword as black-blending
     in gradient stops, and older Chromium versions don't fully support
     color-mix(). Use explicit rgba with alpha 0 instead, and inline the
     brand greens/golds (JC green ≈ #60B567, JC gold ≈ #CAA230) so the
     gradient is identical across browsers. */
  background:
    radial-gradient(600px circle at var(--cursor-x) var(--cursor-y),
      rgba(255, 255, 255, 0.15),
      rgba(255, 255, 255, 0) 60%),
    linear-gradient(135deg,
      rgb(96, 181, 103) 0%,
      rgb(202, 162, 48) 100%);
  background-size: cover;
  background-position: center;
  will-change: background;
  transition: background 0.1s ease;
}

.hero[style*="--hero-image"] {
  background:
    radial-gradient(600px circle at var(--cursor-x) var(--cursor-y),
      rgba(255, 255, 255, 0.12),
      rgba(255, 255, 255, 0) 60%),
    linear-gradient(135deg,
      rgba(96, 181, 103, 0.75) 0%,
      rgba(202, 162, 48, 0.75) 100%),
    var(--hero-image);
  background-size: cover;
  background-position: var(--hero-position, center);
}

/* Diagonal stripe across the bottom of the hero — transitions into the
   following section (e.g. PillarsBar) so there's no visible seam. */
.hero-stripe {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 120px;
  z-index: 5;
  pointer-events: none;
  clip-path: polygon(0 60%, 100% 30%, 100% 100%, 0 100%);
}
.hero-stripe--gold       { background-color: var(--jc-gold); }
.hero-stripe--green      { background-color: var(--jc-green); }
.hero-stripe--deep-green { background-color: var(--jc-deep-green); }

.hero__subtitle {
  font-family: var(--font-heading);
  font-size: var(--text-base, 1rem);
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 0.25rem;
  text-align: inherit;
}
</style>
