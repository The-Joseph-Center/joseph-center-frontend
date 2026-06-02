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
// TODO: replace placeholder video ID with Mona's intro video once it's confirmed
const videoId     = computed(() => props.section?.videoId ?? 'dQw4w9WgXcQ');
const videoTitle  = computed(() => props.section?.videoTitle ?? 'The Joseph Center — Our Story');
const ctaLabel    = computed(() => props.section?.ctaLabel ?? 'Read More');
const ctaUrl      = computed(() => props.section?.ctaUrl ?? '/our-story');
const bandColor   = computed(() => props.section?.bandColor ?? 'gold');
</script>

<template>
  <DiagonalSection :title="title" :color="bandColor">
    <div class="our-story">
      <div class="our-story__video">
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
