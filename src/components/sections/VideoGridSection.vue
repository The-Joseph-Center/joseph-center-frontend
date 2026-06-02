<script setup lang="ts">
import VideoCard from '@/components/ui/VideoCard.vue';
import { useSanity } from '@/composables/useSanity';
import type { SanityImageSource } from '@/types/site';

interface Section {
  heading?: string;
}

interface TestimonialVideo {
  _id: string;
  title: string;
  link: string;
  image?: SanityImageSource | null;
  alt?: string | null;
}

defineProps<{ section?: Section | null }>();

// Production type name is lowercase `testimonialvideo` (case-sensitive in
// Sanity). Order by creation so the lineup is stable.
const query = `*[_type == "testimonialvideo"] | order(_createdAt desc){
  _id, title, link, image, alt
}`;

const { data: videos, loading } = useSanity<TestimonialVideo[]>(query);
</script>

<template>
  <section class="video-grid">
    <div class="video-grid__inner">
      <h2 v-if="section?.heading" class="video-grid__heading">
        {{ section.heading }}
      </h2>

      <div v-if="loading" class="video-grid__state">
        <p>Loading…</p>
      </div>

      <div v-else-if="!videos?.length" class="video-grid__state">
        <p>No testimonial videos to display yet.</p>
      </div>

      <div v-else class="video-grid__grid">
        <VideoCard
          v-for="video in videos"
          :key="video._id"
          :title="video.title"
          :link="video.link"
          :image="video.image"
          :alt="video.alt"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.video-grid {
  padding: 2.5rem 1.5rem 4rem;
  background: var(--color-bg);
}

.video-grid__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.video-grid__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 2rem;
  text-align: center;
}

.video-grid__state {
  text-align: center;
  color: var(--color-text-muted);
  padding: 3rem 0;
}

.video-grid__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .video-grid__grid {
    gap: 2rem;
  }
}

@media (max-width: 480px) {
  .video-grid__grid {
    grid-template-columns: 1fr;
  }
}
</style>
