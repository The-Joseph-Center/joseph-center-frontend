<script setup lang="ts">
import { computed } from 'vue';
import { useSanity } from '@/composables/useSanity';
import SmartLink from '@/components/ui/SmartLink.vue';

interface Section {
  heading?: string;
  subtext?: string;
  ctaLabel?: string;
}

interface Episode {
  _id: string;
  videoId?: string | null;
  title?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;
  episodeNumber?: number | null;
}

const props = defineProps<{ section?: Section | null }>();

const heading = computed(
  () => props.section?.heading || 'Latest from Coffee Chat with Mona'
);
const subtext = computed(
  () =>
    props.section?.subtext ||
    'Honest conversations about hope, homelessness, and the people The Joseph Center is honored to serve.'
);
const ctaLabel = computed(() => props.section?.ctaLabel || 'Watch All Episodes →');

const query = `*[_type == "coffeeEpisode"] | order(publishedAt desc)[0]{
  _id, videoId, title, description, publishedAt, thumbnailUrl, episodeNumber
}`;

const { data: episode, loading } = useSanity<Episode>(query);

function youtubeUrl(videoId?: string | null) {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '#';
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <section class="latest-coffee">
    <div class="latest-coffee__inner">
      <header class="latest-coffee__header">
        <h2 class="latest-coffee__heading">{{ heading }}</h2>
        <p v-if="subtext" class="latest-coffee__subtext">{{ subtext }}</p>
      </header>

      <div v-if="loading" class="latest-coffee__state">Loading…</div>

      <div v-else-if="!episode" class="latest-coffee__state">
        <p>New episodes coming soon.</p>
        <SmartLink to="/media" class="btn-primary">{{ ctaLabel }}</SmartLink>
      </div>

      <div v-else class="latest-coffee__body">
        <a
          :href="youtubeUrl(episode.videoId)"
          target="_blank"
          rel="noopener noreferrer"
          class="latest-coffee__card"
          :aria-label="`Watch the latest episode: ${episode.title || ''}`"
        >
          <div class="latest-coffee__thumb-wrap">
            <img
              v-if="episode.thumbnailUrl"
              :src="episode.thumbnailUrl"
              :alt="episode.title || 'Latest episode'"
              class="latest-coffee__thumb"
              loading="lazy"
            />
            <div v-else class="latest-coffee__thumb-placeholder" />
            <div class="latest-coffee__play" aria-hidden="true">
              <svg viewBox="0 0 68 48" width="60" height="42">
                <path
                  d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                  fill="#FF0000"
                />
                <path d="M45 24L27 14v20" fill="#fff" />
              </svg>
            </div>
          </div>

          <div class="latest-coffee__info">
            <span v-if="episode.episodeNumber" class="latest-coffee__ep-num">
              Episode {{ episode.episodeNumber }}
            </span>
            <h3 class="latest-coffee__title">{{ episode.title }}</h3>
            <time v-if="episode.publishedAt" class="latest-coffee__date">
              {{ formatDate(episode.publishedAt) }}
            </time>
            <p v-if="episode.description" class="latest-coffee__desc">
              {{ episode.description }}
            </p>
          </div>
        </a>

        <div class="latest-coffee__cta">
          <SmartLink to="/media" class="btn-primary">{{ ctaLabel }}</SmartLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.latest-coffee {
  padding: 3rem 1.5rem;
  background: var(--color-bg);
}

.latest-coffee__inner {
  max-width: 1000px;
  margin: 0 auto;
}

.latest-coffee__header {
  text-align: center;
  margin-bottom: 2rem;
}

.latest-coffee__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.latest-coffee__subtext {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 auto;
  max-width: 640px;
}

.latest-coffee__state {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-muted);
  font-style: italic;
}

.latest-coffee__state .btn-primary {
  margin-top: 1rem;
  display: inline-block;
}

.latest-coffee__card {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 1.2fr;
  gap: 1.5rem;
  align-items: center;
  text-decoration: none;
  background: white;
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.latest-coffee__card:hover {
  box-shadow: var(--shadow-card-hover, 0 8px 20px rgba(0, 0, 0, 0.12));
  transform: translateY(-2px);
}

.latest-coffee__thumb-wrap {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--jc-charcoal, #2C3531);
  overflow: hidden;
}

.latest-coffee__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.latest-coffee__thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--jc-deep-green) 0%, var(--jc-charcoal, #2C3531) 100%);
}

.latest-coffee__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.latest-coffee__play svg {
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
  opacity: 0.92;
  transition: opacity 200ms ease, transform 200ms ease;
}

.latest-coffee__card:hover .latest-coffee__play svg {
  opacity: 1;
  transform: scale(1.08);
}

.latest-coffee__info {
  padding: 1.25rem 1.5rem 1.25rem 0;
}

.latest-coffee__ep-num {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--jc-gold);
  display: block;
  margin-bottom: 0.4rem;
}

.latest-coffee__title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
  margin: 0 0 0.4rem;
}

.latest-coffee__date {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  display: block;
  margin-bottom: 0.75rem;
}

.latest-coffee__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.latest-coffee__cta {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

@media (max-width: 720px) {
  .latest-coffee__card {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .latest-coffee__info {
    padding: 1.25rem;
  }
}
</style>
