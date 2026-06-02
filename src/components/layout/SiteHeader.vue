<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useSiteStore } from '@/stores/useSiteStore';
import { sanityImage } from '@/composables/useSanityImage';
import SmartLink from '@/components/ui/SmartLink.vue';

const site = useSiteStore();
const route = useRoute();

const navItems = computed(() => site.headerNav || []);
const volunteerUrl = computed(() => site.volunteerUrl || site.ctaUrl || '/forms/volunteer');
const logoSrc = computed(() =>
  site.logo
    ? sanityImage(site.logo).width(400).height(400).fit('crop').auto('format').url()
    : ''
);
const logoAlt = computed(() => site.name || 'Home');

const menuOpen = ref(false);
const openSection = ref<string | null>(null);
const isScrolled = ref(false);
// Pessimistic default: assume no hero until the DOM proves otherwise. This
// means no-hero pages render the solid header on the first paint with no
// flash; hero pages briefly show solid → transparent once async data lands.
const hasHero = ref(false);
let heroObserver: MutationObserver | null = null;

// Header is transparent when sitting over a hero (white text/hamburger over a
// dark image). On pages without a hero, force the solid/scrolled styling
// so the hamburger and Volunteer button stay visible. While the full-screen
// menu is open, force transparent so the bar doesn't show as a white strip
// across the top of the dark-green menu overlay.
const isSolid = computed(() => {
  if (menuOpen.value) return false;
  return isScrolled.value || !hasHero.value;
});

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  openSection.value = null;
}

function toggleSection(label: string) {
  openSection.value = openSection.value === label ? null : label;
}

function closeMenu() {
  menuOpen.value = false;
  openSection.value = null;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && menuOpen.value) closeMenu();
}

function handleScroll() {
  isScrolled.value = window.scrollY > 20;
}

function detectHero() {
  hasHero.value = !!document.querySelector('#main-content .hero');
}

function startHeroObserver() {
  const target = document.getElementById('main-content');
  if (!target) return;
  heroObserver = new MutationObserver(detectHero);
  heroObserver.observe(target, { childList: true, subtree: true });
}

watch(menuOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : '';
});

// Auto-close menu + re-detect hero on route change
watch(() => route.path, async () => {
  closeMenu();
  hasHero.value = false; // pessimistic reset; observer will flip it true if a hero mounts
  await nextTick();
  detectHero();
});

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  await nextTick();
  detectHero();
  startHeroObserver();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('scroll', handleScroll);
  heroObserver?.disconnect();
  document.body.style.overflow = '';
});
</script>

<template>
  <!-- Header bar — absolute by default, transparent over hero; bg fades to white once scrolled -->
  <header class="jc-header" :class="{ 'jc-header--scrolled': isSolid }">
    <!-- Concentric coin logo, overflowing top-left -->
    <SmartLink to="/" class="jc-coin" :aria-label="logoAlt">
      <span class="jc-coin__ring jc-coin__ring--gold">
        <span class="jc-coin__ring jc-coin__ring--dark">
          <span class="jc-coin__ring jc-coin__ring--green">
            <img v-if="logoSrc" :src="logoSrc" :alt="logoAlt" class="jc-coin__img" />
          </span>
        </span>
      </span>
    </SmartLink>

    <!-- Right-side actions -->
    <div class="jc-header__actions">
      <SmartLink :to="volunteerUrl" class="jc-volunteer-btn">Volunteer</SmartLink>
      <button
        class="jc-burger"
        :class="{ 'jc-burger--open': menuOpen }"
        :aria-expanded="menuOpen"
        aria-controls="jc-mobile-menu"
        aria-label="Toggle menu"
        @click="toggleMenu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <!-- Full-screen overlay menu (slides in from left) -->
  <Teleport to="body">
    <nav
      id="jc-mobile-menu"
      class="jc-menu"
      :class="{ 'jc-menu--open': menuOpen }"
      :aria-hidden="!menuOpen"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
    >
      <!-- Menu top bar (mirrors header) -->
      <div class="jc-menu__topbar">
        <SmartLink to="/" class="jc-menu__logo" :aria-label="logoAlt" @click="closeMenu">
          <img v-if="logoSrc" :src="logoSrc" :alt="logoAlt" />
        </SmartLink>
      </div>

      <!-- Nav items -->
      <ul class="jc-menu__links">
        <template v-for="item in navItems" :key="item.label">
          <!-- Direct link -->
          <template v-if="!item.children || item.children.length === 0">
            <li>
              <SmartLink :to="item.href!" @click="closeMenu">{{ item.label }}</SmartLink>
            </li>
            <hr />
          </template>

          <!-- Accordion section -->
          <template v-else>
            <li class="jc-menu__accordion">
              <button
                type="button"
                class="jc-menu__accordion-trigger"
                :aria-expanded="openSection === item.label"
                @click="toggleSection(item.label)"
              >
                {{ item.label }}
                <span
                  class="jc-menu__plus"
                  :class="{ 'jc-menu__plus--open': openSection === item.label }"
                  aria-hidden="true"
                >+</span>
              </button>
            </li>
            <hr />
            <li v-if="openSection === item.label" class="jc-menu__sublist">
              <SmartLink
                v-for="child in item.children"
                :key="child.label"
                :to="child.href"
                @click="closeMenu"
              >{{ child.label }}</SmartLink>
            </li>
          </template>
        </template>
      </ul>

    </nav>
  </Teleport>
</template>

<style scoped>
/* Local fallbacks for the JC palette — themed sites should override these via global CSS vars */
.jc-header,
.jc-menu {
  --jc-white: #ffffff;
  --jc-green: var(--color-primary, #60B567);
  --jc-darkgreen: var(--jc-deep-green, #1D5F55);
  --jc-gold: var(--color-secondary, #CAA230);
  --jc-nav-height: 120px;
  --jc-nav-height-mobile: 90px;
  --jc-lg-circle: 260px;
  --jc-sm-circle: 200px;
}

/* ── Header bar (fixed, transparent over hero; bg fades to white on scroll) ── */
.jc-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--jc-nav-height);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 50px;
  z-index: 1000;
  color: var(--jc-white);
  background: transparent;
  transition: background-color 300ms ease, box-shadow 300ms ease;
}

.jc-header--scrolled {
  background: var(--color-bg);
  box-shadow: var(--shadow-header, 0 1px 8px rgba(44, 53, 49, 0.08));
}

/* On scrolled white header, hamburger needs to flip to dark for visibility */
.jc-header--scrolled .jc-burger:not(.jc-burger--open) span {
  background: var(--jc-charcoal, #2C3531);
}

/* And the volunteer button's white border/outline disappears on white bg —
   swap to authority green so the gold pill still has a visible ring */
.jc-header--scrolled .jc-volunteer-btn {
  border-color: var(--jc-darkgreen);
  outline-color: var(--jc-darkgreen);
}

@media (max-width: 450px) {
  .jc-header {
    height: var(--jc-nav-height-mobile);
    padding-right: 20px;
  }
}

/* ── Concentric coin logo (3 rings + image) ──────────────────────────── */
.jc-coin {
  position: absolute;
  top: -70px;
  left: -70px;
  display: block;
  text-decoration: none;
}

@media (max-width: 450px) {
  .jc-coin {
    top: -50px;
    left: -50px;
  }
}

.jc-coin__ring {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.jc-coin__ring--gold {
  width: var(--jc-lg-circle);
  height: var(--jc-lg-circle);
  background: var(--jc-gold);
}

.jc-coin__ring--dark {
  width: calc(var(--jc-lg-circle) - 40px);
  height: calc(var(--jc-lg-circle) - 40px);
  background: var(--jc-darkgreen);
}

.jc-coin__ring--green {
  width: calc(var(--jc-lg-circle) - 80px);
  height: calc(var(--jc-lg-circle) - 80px);
  background: var(--jc-green);
}

.jc-coin__img {
  width: 85%;
  height: 85%;
  object-fit: contain;
  /* Nudge image right + down to optically center within the visible
     portion of the coin (rings overflow ~70px past the top-left corner). */
  transform: translate(8px, 8px);
}

@media (max-width: 450px) {
  .jc-coin__ring--gold  { width: var(--jc-sm-circle); height: var(--jc-sm-circle); }
  .jc-coin__ring--dark  { width: calc(var(--jc-sm-circle) - 40px); height: calc(var(--jc-sm-circle) - 40px); }
  .jc-coin__ring--green { width: calc(var(--jc-sm-circle) - 80px); height: calc(var(--jc-sm-circle) - 80px); }
  .jc-coin__img { transform: translate(6px, 6px); }
}

/* ── Right-side actions ──────────────────────────────────────────────── */
.jc-header__actions {
  height: calc(var(--jc-nav-height) / 1.5);
  display: flex;
  align-items: center;
  gap: 20px;
}

@media (max-width: 450px) {
  .jc-header__actions {
    height: calc(var(--jc-nav-height-mobile) / 1.5);
  }
}

/* ── Volunteer button (layered: white border + gold outline + gold bg + white text) ─ */
.jc-volunteer-btn {
  color: var(--jc-white);
  background: var(--jc-gold);
  border: 2px solid var(--jc-white);
  outline: 1px solid var(--jc-white);
  padding: 5px 12px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-decoration: none;
  white-space: nowrap;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.jc-volunteer-btn:hover {
  border-color: var(--jc-gold);
  outline-color: var(--jc-gold);
  box-shadow: none;
}

@media (max-width: 450px) {
  .jc-volunteer-btn {
    display: none;
  }
}

/* ── Hamburger (3 spans → X animation) ───────────────────────────────── */
.jc-burger {
  position: relative;
  width: 32px;
  height: 24px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-block;
  z-index: 1001;
}

.jc-burger span {
  position: absolute;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--jc-white);
  border-radius: 2px;
  transition: transform 0.3s ease, top 0.3s ease, opacity 0.2s ease;
}

.jc-burger span:nth-child(1) { top: 4px; }
.jc-burger span:nth-child(2) { top: 11px; }
.jc-burger span:nth-child(3) { top: 18px; }

.jc-burger--open span:nth-child(1) {
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.jc-burger--open span:nth-child(2) {
  opacity: 0;
}

.jc-burger--open span:nth-child(3) {
  top: 50%;
  transform: translateY(-50%) rotate(-45deg);
}

.jc-burger:focus-visible {
  outline: 2px solid var(--jc-white);
  outline-offset: 4px;
}

/* ── Full-screen menu (slides in from left) ──────────────────────────── */
.jc-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: var(--jc-darkgreen);
  z-index: 999;
  transform: translateX(-100%);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.jc-menu--open {
  transform: translateX(0);
}

/* Menu top bar (mirrors header) */
.jc-menu__topbar {
  position: relative;
  width: 100%;
  height: var(--jc-nav-height);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 50px;
  flex-shrink: 0;
}

@media (max-width: 450px) {
  .jc-menu__topbar {
    height: var(--jc-nav-height-mobile);
    padding: 0 20px;
  }
}

.jc-menu__logo {
  width: var(--jc-nav-height);
  height: var(--jc-nav-height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.jc-menu__logo img {
  width: 85%;
  height: 85%;
  object-fit: contain;
  border-radius: 50%;
}

@media (max-width: 450px) {
  .jc-menu__logo {
    width: var(--jc-nav-height-mobile);
    height: var(--jc-nav-height-mobile);
  }
}

/* Nav links */
.jc-menu__links {
  list-style: none;
  margin: 0;
  padding: 90px 50px calc(var(--jc-nav-height) * 0.5);
  flex: 1;
}

@media (max-width: 450px) {
  .jc-menu__links {
    padding: 70px 24px calc(var(--jc-nav-height-mobile) * 0.5);
  }
}

.jc-menu__links li {
  list-style: none;
  margin: 0;
  padding: 0;
}

.jc-menu__links a,
.jc-menu__accordion-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 0;
  color: var(--jc-white);
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
}

.jc-menu__links a:focus-visible,
.jc-menu__accordion-trigger:focus-visible {
  outline: 2px solid var(--jc-white);
  outline-offset: 2px;
}

.jc-menu__links hr {
  border: none;
  border-top: 2px solid var(--jc-white);
  margin: 0;
}

/* Rotating + icon */
.jc-menu__plus {
  display: inline-block;
  font-size: 1.4rem;
  font-weight: 300;
  line-height: 1;
  transition: transform 0.2s ease-in-out;
}

.jc-menu__plus--open {
  transform: rotate(45deg);
}

/* Sub-list */
.jc-menu__sublist {
  display: flex;
  flex-direction: column;
  padding: 0 0 12px 20px;
}

.jc-menu__sublist a {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  padding: 0.5rem 0;
  color: var(--jc-white);
  opacity: 0.92;
}

.jc-menu__sublist a:hover {
  opacity: 1;
}

@media (max-width: 325px) {
  .jc-menu__sublist a,
  .jc-menu__links a,
  .jc-menu__accordion-trigger {
    letter-spacing: 0;
  }
}

</style>
