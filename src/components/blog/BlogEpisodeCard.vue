<script setup lang="ts">
defineProps<{
  episode: {
    _id: string;
    title: string;
    videoId: string;
    thumbnailUrl?: string | null;
    publishedAt: string;
    episodeNumber?: number | null;
  };
}>();

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
</script>

<template>
  <article class="blog-episode-card">
    <a
      :href="`https://www.youtube.com/watch?v=${episode.videoId}`"
      target="_blank"
      rel="noopener noreferrer"
      class="blog-episode-card__link"
    >
      <div class="blog-episode-card__thumb-wrap">
        <img
          :src="episode.thumbnailUrl ?? `https://img.youtube.com/vi/${episode.videoId}/hqdefault.jpg`"
          :alt="episode.title"
          class="blog-episode-card__thumb"
          loading="lazy"
        />
        <div class="blog-episode-card__play" aria-hidden="true">
          <svg viewBox="0 0 68 48" width="48" height="34">
            <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#FF0000"/>
            <path d="M45 24L27 14v20" fill="#fff"/>
          </svg>
        </div>
      </div>
      <div class="blog-episode-card__body">
        <div class="blog-episode-card__meta">
          <span class="blog-episode-card__type">Coffee Chat</span>
          <span v-if="episode.episodeNumber" class="blog-episode-card__ep">
            Ep. {{ episode.episodeNumber }}
          </span>
          <time class="blog-episode-card__date">{{ formatDate(episode.publishedAt) }}</time>
        </div>
        <h2 class="blog-episode-card__title">{{ episode.title }}</h2>
        <span class="blog-episode-card__watch">Watch on YouTube →</span>
      </div>
    </a>
  </article>
</template>

<style scoped>
.blog-episode-card {
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.5rem);
  overflow: hidden;
  background: white;
  transition: box-shadow 200ms ease;
}
.blog-episode-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }

.blog-episode-card__link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.blog-episode-card__thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--jc-charcoal, #2c3531);
}
.blog-episode-card__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.blog-episode-card__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.blog-episode-card__body {
  padding: 1.5rem;
  flex: 1;
}

.blog-episode-card__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.blog-episode-card__type {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--jc-deep-green);
  background: rgba(29, 95, 85, 0.08);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.blog-episode-card__ep,
.blog-episode-card__date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.blog-episode-card__title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem;
  line-height: 1.3;
}

.blog-episode-card__watch {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--jc-deep-green);
}

</style>
