<script setup lang="ts">
import { computed } from 'vue';
import VideoCard from '@/components/ui/VideoCard.vue';

interface ProgramVideo {
  title: string;
  link: string;
}

const props = withDefaults(defineProps<{
  videos?: ProgramVideo[];
  intro?: string;
  layout?: 'single' | 'grid';
}>(), {
  videos: () => [],
  layout: 'grid',
});

const hasVideos = computed(() => (props.videos?.length ?? 0) > 0);
</script>

<template>
  <section v-if="hasVideos" class="program-testimonials">
    <div class="program-testimonials__inner">
      <h2 class="program-testimonials__heading">Their Words</h2>

      <p v-if="intro" class="program-testimonials__intro">{{ intro }}</p>

      <div v-if="layout === 'single' && videos[0]" class="program-testimonials__single">
        <VideoCard
          :title="videos[0].title"
          :link="videos[0].link"
        />
      </div>

      <div v-else class="program-testimonials__grid">
        <VideoCard
          v-for="video in videos"
          :key="video.link"
          :title="video.title"
          :link="video.link"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.program-testimonials {
  padding: 3rem 1.5rem;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.program-testimonials__inner {
  max-width: 1200px;
  margin: 0 auto;
}

.program-testimonials__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

.program-testimonials__intro {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 2rem;
  max-width: 600px;
}

.program-testimonials__single {
  max-width: 480px;
}

.program-testimonials__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .program-testimonials__grid {
    grid-template-columns: 1fr;
  }
}
</style>
