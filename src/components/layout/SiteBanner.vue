<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { PortableText } from '@portabletext/vue';
import type { TypedObject } from '@portabletext/types';
import { useSanity } from '@/composables/useSanity';

interface BannerDoc {
  _id: string;
  _updatedAt?: string;
  title?: string;
  message?: TypedObject[];
  active?: boolean;
}

// Single-doc query — only return the banner if it's marked active. coalesce
// to true so docs predating the active field still show.
const query = `*[_type == "banner" && coalesce(active, true) == true][0]{
  _id, _updatedAt, title, message, active
}`;

const { data: banner, loading } = useSanity<BannerDoc | null>(query);

// Dismiss flag keyed by banner _id + _updatedAt so editing the banner
// re-shows it to visitors who previously dismissed an older version.
const dismissedKey = computed(() =>
  banner.value ? `jc_banner_dismissed:${banner.value._id}:${banner.value._updatedAt ?? ''}` : null
);

const dismissed = ref(false);

watch(
  dismissedKey,
  (key) => {
    if (!key || typeof window === 'undefined') {
      dismissed.value = false;
      return;
    }
    dismissed.value = window.localStorage.getItem(key) === '1';
  },
  { immediate: true }
);

function dismiss() {
  if (!dismissedKey.value || typeof window === 'undefined') return;
  window.localStorage.setItem(dismissedKey.value, '1');
  dismissed.value = true;
}

const shouldShow = computed(
  () => !loading.value && !!banner.value?.message && !dismissed.value
);

// Custom portable-text components — render links as <a target="_blank"> with
// the banner's gold underline. PortableText doesn't accept inline component
// definitions cleanly in Vue, so we keep marks rendering default but style
// links via CSS below.
</script>

<template>
  <Transition name="banner-fade">
    <div v-if="shouldShow" class="site-banner" role="region" :aria-label="banner?.title || 'Site announcement'">
      <div class="site-banner__inner">
        <div class="site-banner__message">
          <PortableText :value="banner!.message!" />
        </div>
        <button
          type="button"
          class="site-banner__dismiss"
          aria-label="Dismiss announcement"
          @click="dismiss"
        >
          ×
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Callout-style announcement: cream background with a thick gold left-bar
   on the inner container. Distinct from every other colored band on the
   site — the deep-green chrome and the gold accent stripes. */
.site-banner {
  background: var(--color-bg-subtle, #f4f1ea);
}

.site-banner__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.85rem 1.25rem 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  border-left: 5px solid var(--jc-gold);
}

.site-banner__message {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.5;
  flex: 1;
}

.site-banner__message :deep(p) {
  margin: 0;
  color: var(--jc-deep-green);
}

.site-banner__message :deep(a) {
  color: var(--jc-deep-green);
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: var(--jc-gold);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  transition: color 150ms ease, text-decoration-color 150ms ease;
}

.site-banner__message :deep(a:hover) {
  color: var(--jc-gold);
}

.site-banner__message :deep(strong) {
  font-weight: 700;
  color: var(--jc-deep-green);
}

.site-banner__dismiss {
  background: transparent;
  border: none;
  color: rgba(29, 95, 85, 0.55);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
  transition: color 150ms ease;
  flex-shrink: 0;
}

.site-banner__dismiss:hover {
  color: var(--jc-deep-green);
}

.site-banner__dismiss:focus-visible {
  outline: 2px solid var(--jc-gold);
  outline-offset: 2px;
  border-radius: 2px;
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 200ms ease, max-height 250ms ease;
  overflow: hidden;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
  max-height: 0;
}

.banner-fade-enter-to,
.banner-fade-leave-from {
  opacity: 1;
  max-height: 120px;
}

@media (max-width: 600px) {
  .site-banner__inner {
    padding: 0.65rem 1rem;
  }
  .site-banner__message {
    font-size: var(--text-xs);
  }
}
</style>
