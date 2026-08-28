<script setup lang="ts">
import { computed } from 'vue';
import DiagonalSection from '@/components/sections/DiagonalSection.vue';
import SmartLink from '@/components/ui/SmartLink.vue';

interface Section {
  title?: string;
  body?: string;
  videoId?: string;
  videoTitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  bandColor?: 'gold' | 'green' | 'deep-green';
}

const props = defineProps<{ section?: Section }>();

const title       = computed(() => props.section?.title ?? 'Our Story');
const body        = computed(() => props.section?.body ?? 'We founded The Joseph Center in 2016 to build a community where everyone can thrive with dignity and purpose.');
// No fallback video on purpose: an unset videoId renders the placeholder panel
// rather than an arbitrary embed. (This previously defaulted to a well-known
// joke video — harmless while every ourStorySection had a real id set, but one
// unset field away from shipping on a nonprofit's homepage.)
const videoId     = computed(() => props.section?.videoId?.trim() || '');
const videoTitle  = computed(() => props.section?.videoTitle ?? 'The Joseph Center — Our Story');
const ctaLabel    = computed(() => props.section?.ctaLabel ?? 'Read More');
const ctaUrl      = computed(() => props.section?.ctaUrl ?? '/our-story');
const bandColor   = computed(() => props.section?.bandColor ?? 'gold');
</script>

<template>
  <DiagonalSection :title="title" :color="bandColor">
    <div class="our-story" :class="{ 'our-story--no-video': !videoId }">
      <div v-if="videoId" class="our-story__video">
        <iframe
          :src="`https://www.youtube.com/embed/${videoId}`"
          :title="videoTitle"
          loading="lazy"
          allowfullscreen
        ></iframe>
      </div>
      <div class="our-story__copy">
        <p class="our-story__body">{{ body }}</p>
        <SmartLink :to="ctaUrl" class="btn-primary">
          {{ ctaLabel }} <span aria-hidden="true">→</span>
        </SmartLink>
      </div>
    </div>
  </DiagonalSection>
</template>

<style scoped>
.our-story {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

/* No video yet — collapse to a single centered column instead of leaving an
   empty 16:9 well. Setting a videoId in Studio restores the two-up split. */
.our-story--no-video {
  grid-template-columns: 1fr;
  max-width: 680px;
  text-align: center;
}
.our-story--no-video .our-story__copy {
  align-items: center;
}

.our-story__video {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
  border-radius: var(--radius-card);
}

.our-story__video iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.our-story__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
}

.our-story__body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.8;
  margin: 0;
}

@media (max-width: 768px) {
  .our-story {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .our-story__copy {
    align-items: stretch;
    text-align: center;
  }
}
</style>
