<script setup lang="ts">
import { computed } from 'vue';
import { useSanity } from '@/composables/useSanity';

interface Section {
  seriesTitle?: string;
  seriesDescription?: string;
}

interface Platform {
  name?: string;
  url?: string;
}

interface CoffeeEpisode {
  _id: string;
  videoId?: string | null;
  title?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;
  episodeNumber?: number | null;
  platforms?: Platform[] | null;
  featured?: boolean | null;
}

interface QueryResult {
  featured: CoffeeEpisode | null;
  episodes: CoffeeEpisode[];
}

const props = defineProps<{ section?: Section | null }>();

const seriesTitle = computed(
  () => props.section?.seriesTitle || 'Coffee Chat with Mona'
);
const seriesDescription = computed(
  () =>
    props.section?.seriesDescription ||
    'Honest conversations about hope, homelessness, and the people The Joseph Center is honored to serve.'
);

const query = `{
  "featured": *[_type == "coffeeEpisode" && featured == true] | order(publishedAt desc)[0]{
    _id, videoId, title, description, publishedAt, thumbnailUrl, episodeNumber, platforms
  },
  "episodes": *[_type == "coffeeEpisode"] | order(publishedAt desc){
    _id, videoId, title, publishedAt, thumbnailUrl, episodeNumber, platforms
  }
}`;

const { data, loading } = useSanity<QueryResult>(query);

const featuredEpisode = computed<CoffeeEpisode | null>(
  () => data.value?.featured ?? data.value?.episodes?.[0] ?? null
);

const gridEpisodes = computed<CoffeeEpisode[]>(() => {
  const all = data.value?.episodes ?? [];
  const fid = featuredEpisode.value?._id;
  return fid ? all.filter((e) => e._id !== fid) : all;
});

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

function youtubeUrl(videoId?: string | null) {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '#';
}
</script>

<template>
  <section class="podcast">
    <div class="podcast__inner">
      <header class="podcast__header">
        <h1 class="podcast__series-title">{{ seriesTitle }}</h1>
        <p class="podcast__series-desc">{{ seriesDescription }}</p>
      </header>

      <div v-if="loading" class="podcast__state">
        <p>Loading episodes…</p>
      </div>

      <template v-else-if="featuredEpisode">
        <!-- Featured episode -->
        <a
          :href="youtubeUrl(featuredEpisode.videoId)"
          target="_blank"
          rel="noopener noreferrer"
          class="podcast__featured"
          :aria-label="`Watch featured episode: ${featuredEpisode.title}`"
        >
          <div class="podcast__featured-thumb-wrap">
            <img
              v-if="featuredEpisode.thumbnailUrl"
              :src="featuredEpisode.thumbnailUrl"
              :alt="featuredEpisode.title || 'Featured episode'"
              class="podcast__featured-thumb"
              loading="eager"
            />
            <div v-else class="podcast__thumb-placeholder" />
            <div class="podcast__featured-play" aria-hidden="true">
              <svg viewBox="0 0 68 48" width="64" height="45">
                <path
                  d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                  fill="#FF0000"
                />
                <path d="M45 24L27 14v20" fill="#fff" />
              </svg>
            </div>
          </div>

          <div class="podcast__featured-info">
            <div v-if="featuredEpisode.episodeNumber" class="podcast__ep-num">
              Episode {{ featuredEpisode.episodeNumber }}
            </div>
            <h2 class="podcast__featured-title">{{ featuredEpisode.title }}</h2>
            <p v-if="featuredEpisode.description" class="podcast__featured-desc">
              {{ featuredEpisode.description }}
            </p>
            <time v-if="featuredEpisode.publishedAt" class="podcast__featured-date">
              {{ formatDate(featuredEpisode.publishedAt) }}
            </time>

            <div v-if="featuredEpisode.platforms?.length" class="podcast__platforms">
              <a
                v-for="p in featuredEpisode.platforms"
                :key="p.name || p.url"
                :href="p.url || '#'"
                target="_blank"
                rel="noopener noreferrer"
                class="podcast__platform-pill"
                @click.stop
              >
                {{ p.name }}
              </a>
            </div>
          </div>
        </a>

        <!-- Episode grid -->
        <div v-if="gridEpisodes.length" class="podcast__grid">
          <a
            v-for="ep in gridEpisodes"
            :key="ep._id"
            :href="youtubeUrl(ep.videoId)"
            target="_blank"
            rel="noopener noreferrer"
            class="podcast__episode"
          >
            <div class="podcast__ep-thumb-wrap">
              <img
                v-if="ep.thumbnailUrl"
                :src="ep.thumbnailUrl"
                :alt="ep.title || 'Episode'"
                class="podcast__ep-thumb"
                loading="lazy"
              />
              <div v-else class="podcast__thumb-placeholder" />
            </div>
            <div class="podcast__ep-info">
              <span v-if="ep.episodeNumber" class="podcast__ep-num podcast__ep-num--small">
                Ep. {{ ep.episodeNumber }}
              </span>
              <p class="podcast__ep-title">{{ ep.title }}</p>
              <time v-if="ep.publishedAt" class="podcast__ep-date">
                {{ formatDate(ep.publishedAt) }}
              </time>
            </div>
          </a>
        </div>
      </template>

      <div v-else class="podcast__state">
        <p>Episodes coming soon.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.podcast {
  padding: 3rem 1.5rem 4rem;
  background: var(--color-bg);
}

.podcast__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.podcast__header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.podcast__series-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl, 2.5rem);
  font-weight: 800;
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

.podcast__series-desc {
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.podcast__featured {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  align-items: center;
  text-decoration: none;
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  margin-bottom: 2.5rem;
  background: white;
  transition: box-shadow 200ms ease;
}

.podcast__featured:hover {
  box-shadow: var(--shadow-card-hover, 0 8px 20px rgba(0, 0, 0, 0.14));
}

.podcast__featured-thumb-wrap {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--jc-charcoal, #2C3531);
}

.podcast__featured-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.podcast__featured-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.podcast__featured-play svg {
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
}

.podcast__featured-info {
  padding: 1.5rem 1.5rem 1.5rem 0;
}

.podcast__ep-num {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--jc-gold);
  margin: 0 0 0.5rem;
}

.podcast__ep-num--small {
  font-size: var(--text-xs);
}

.podcast__featured-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.75rem;
  line-height: 1.3;
}

.podcast__featured-desc {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.podcast__featured-date {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  display: block;
  margin-bottom: 1rem;
}

.podcast__platforms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.podcast__platform-pill {
  padding: 0.3rem 0.875rem;
  border-radius: 999px;
  background: var(--jc-deep-green);
  color: white;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: opacity 150ms ease;
}

.podcast__platform-pill:hover {
  opacity: 0.85;
}

.podcast__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.podcast__episode {
  text-decoration: none;
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  border: 1px solid var(--color-border, #e0d8c5);
  background: white;
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.podcast__episode:hover {
  box-shadow: var(--shadow-card-hover, 0 8px 20px rgba(0, 0, 0, 0.14));
  transform: translateY(-2px);
}

.podcast__ep-thumb-wrap {
  aspect-ratio: 16 / 9;
  background: var(--color-bg-subtle, #f4f1ea);
  overflow: hidden;
}

.podcast__ep-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.podcast__thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--jc-deep-green) 0%, var(--jc-charcoal, #2C3531) 100%);
}

.podcast__ep-info {
  padding: 0.875rem;
}

.podcast__ep-title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
  margin: 0.25rem 0 0.375rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.podcast__ep-date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.podcast__state {
  text-align: center;
  padding: 3rem 0;
  color: var(--color-text-muted);
  font-style: italic;
}

@media (max-width: 768px) {
  .podcast__featured {
    grid-template-columns: 1fr;
  }
  .podcast__featured-info {
    padding: 1.25rem;
  }
  .podcast__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .podcast__grid {
    grid-template-columns: 1fr;
  }
}
</style>
