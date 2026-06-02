<script setup lang="ts">
import { computed } from 'vue';

interface Section {
  introText?: string;
  videoId?: string;
  placeholderLabel?: string;
}

const props = defineProps<{ section?: Section | null }>();

const hasVideo = computed(() => !!props.section?.videoId?.trim());
const placeholderLabel = computed(
  () => props.section?.placeholderLabel?.trim() || 'Video coming soon'
);
</script>

<template>
  <section class="video-section">
    <div class="video-section__inner">
      <p v-if="section?.introText" class="video-section__intro">
        {{ section.introText }}
      </p>

      <div class="video-section__frame-wrap">
        <iframe
          v-if="hasVideo"
          class="video-section__iframe"
          :src="`https://www.youtube.com/embed/${section!.videoId}`"
          :title="section?.introText || 'Video'"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        />
        <div v-else class="video-section__placeholder">
          <p class="video-section__placeholder-label">{{ placeholderLabel }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.video-section {
  padding: 3.5rem 1.5rem;
  background: var(--color-bg);
}

.video-section__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.video-section__intro {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-style: italic;
  color: var(--color-text-muted);
  text-align: center;
  max-width: 600px;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
}

.video-section__frame-wrap {
  position: relative;
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  background: var(--jc-charcoal, #2C3531);
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
}

.video-section__iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.video-section__placeholder {
  position: absolute;
  inset: 0;
  background: var(--jc-deep-green);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-section__placeholder-label {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-style: italic;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.04em;
  margin: 0;
}
</style>
