<script setup lang="ts">
import { computed, ref } from 'vue';
import { sanityImage } from '@/composables/useSanityImage';
import type { SanityImageSource } from '@/types/site';

const props = defineProps<{
  title: string;
  link: string;
  image?: SanityImageSource | null;
  alt?: string | null;
}>();

// Extract the 11-char YouTube ID from any common URL shape:
//   https://youtu.be/<ID>
//   https://www.youtube.com/watch?v=<ID>
//   https://www.youtube.com/embed/<ID>
//   https://www.youtube.com/shorts/<ID>
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

const videoId = computed(() => extractYouTubeId(props.link));
const watchUrl = computed(() =>
  videoId.value ? `https://www.youtube.com/watch?v=${videoId.value}` : props.link
);

const sanityThumb = computed(() => {
  if (!props.image) return null;
  try {
    return sanityImage(props.image).width(800).height(450).fit('crop').auto('format').url();
  } catch {
    return null;
  }
});

const ytThumb = computed(() =>
  videoId.value ? `https://img.youtube.com/vi/${videoId.value}/hqdefault.jpg` : null
);

// Prefer the editor-uploaded Sanity image when present; fall back to YouTube's
// CDN thumb. Track load failure so we can degrade to the placeholder.
const sanityBroken = ref(false);
const ytBroken = ref(false);

const currentThumb = computed(() => {
  if (sanityThumb.value && !sanityBroken.value) return sanityThumb.value;
  if (ytThumb.value && !ytBroken.value) return ytThumb.value;
  return null;
});

function onThumbError() {
  if (sanityThumb.value && !sanityBroken.value) {
    sanityBroken.value = true;
  } else {
    ytBroken.value = true;
  }
}
</script>

<template>
  <a
    :href="watchUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="video-card"
    :aria-label="`Watch ${title}'s story on YouTube`"
  >
    <div class="video-card__thumb-wrap">
      <img
        v-if="currentThumb"
        :src="currentThumb"
        :alt="alt || `${title} testimonial thumbnail`"
        class="video-card__thumb"
        loading="lazy"
        @error="onThumbError"
      />
      <div v-else class="video-card__thumb-placeholder" aria-hidden="true"></div>

      <div class="video-card__play" aria-hidden="true">
        <svg viewBox="0 0 68 48" width="68" height="48">
          <path
            d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
            fill="#FF0000"
          />
          <path d="M45 24L27 14v20" fill="#fff" />
        </svg>
      </div>
    </div>

    <div class="video-card__banner">{{ title }}</div>
  </a>
</template>

<style scoped>
.video-card {
  display: block;
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  text-decoration: none;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.08));
  transition: transform 200ms ease, box-shadow 200ms ease;
  background: var(--jc-charcoal, #2C3531);
}

.video-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover, 0 8px 20px rgba(0, 0, 0, 0.14));
}

.video-card__thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--jc-charcoal, #2C3531);
}

.video-card__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 400ms ease;
}

.video-card:hover .video-card__thumb {
  transform: scale(1.04);
}

.video-card__thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--jc-deep-green) 0%, var(--jc-charcoal, #2C3531) 100%);
}

.video-card__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.video-card__play svg {
  transition: transform 200ms ease, opacity 200ms ease;
  opacity: 0.92;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
}

.video-card:hover .video-card__play svg {
  transform: scale(1.12);
  opacity: 1;
}

.video-card__banner {
  background: var(--jc-gold);
  color: white;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.7rem 1rem;
  text-align: center;
}
</style>
