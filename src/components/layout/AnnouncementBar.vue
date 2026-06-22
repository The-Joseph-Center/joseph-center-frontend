<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSiteStore } from '@/stores/useSiteStore';

// Dismissible announcement bar driven entirely by siteSettings.donationConfig.
// .announcementBar in Sanity. Auto-hides after its expiresAt timestamp — no
// staff action required when the campaign window ends.

const site = useSiteStore();
const dismissed = ref(false);

const bar = computed(() => site.donationConfig?.announcementBar);

const isVisible = computed(() => {
  if (dismissed.value) return false;
  return site.isAnnouncementBarVisible;
});
</script>

<template>
  <div v-if="isVisible && bar" class="announcement-bar" role="banner">
    <p class="announcement-bar__text">
      {{ bar.text }}
      <a
        v-if="bar.linkUrl"
        :href="bar.linkUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="announcement-bar__link"
      >
        {{ bar.linkLabel }}
      </a>
    </p>
    <button
      type="button"
      class="announcement-bar__dismiss"
      aria-label="Dismiss announcement"
      @click="dismissed = true"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.announcement-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--jc-deep-green);
  padding: 0.6rem 2.75rem 0.6rem 1.5rem;
  position: relative;
}

.announcement-bar__text {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
  text-align: center;
  line-height: 1.5;
}

.announcement-bar__link {
  color: var(--jc-gold);
  font-weight: 600;
  text-decoration: none;
  margin-left: 0.25rem;
}
.announcement-bar__link:hover {
  text-decoration: underline;
}

.announcement-bar__dismiss {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}
.announcement-bar__dismiss:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}
.announcement-bar__dismiss:focus-visible {
  outline: 2px solid var(--jc-gold);
  outline-offset: 2px;
}
</style>
