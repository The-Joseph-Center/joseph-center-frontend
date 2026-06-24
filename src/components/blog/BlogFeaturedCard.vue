<script setup lang="ts">
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';

// Hero card for the top of /blog. Accepts any of the three feed item shapes
// (post / coffeeEpisode / events) and renders a wider, image-left layout so
// the most recent item gets visual weight above the 2-col grid below.

interface PortableSpan { _type?: string; text?: string }
interface PortableBlock { _type?: string; children?: PortableSpan[] }

interface PostItem {
  _id: string;
  _type: 'post';
  title: string;
  slug: { current: string };
  excerpt?: string | null;
  publishedAt: string;
  postType?: 'newsletter' | 'manual';
  featuredImage?: { asset?: { url?: string }; alt?: string | null } | null;
  authorName?: string | null;
  authorIsOrg?: boolean;
}
interface EpisodeItem {
  _id: string;
  _type: 'coffeeEpisode';
  title: string;
  videoId: string;
  thumbnailUrl?: string | null;
  publishedAt: string;
  episodeNumber?: number | null;
}
interface EventItem {
  _id: string;
  _type: 'events';
  title: string;
  slug: { current: string };
  date?: string | null;
  description?: PortableBlock[] | string | null;
  image?: { asset?: { url?: string }; alt?: string | null } | null;
}
type Item = PostItem | EpisodeItem | EventItem;

const props = defineProps<{ item: Item }>();

function formatDate(d?: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Per-type derived values keep the template clean and the discriminated union
// honest. typeLabel feeds a colored pill; href/target route the click.
const typeLabel = computed<string>(() => {
  if (props.item._type === 'post') {
    return props.item.postType === 'newsletter' ? 'Newsletter' : 'Article';
  }
  if (props.item._type === 'coffeeEpisode') return 'Coffee Chat';
  return 'Event';
});

const typeClass = computed<string>(() => {
  if (props.item._type === 'post') {
    return props.item.postType === 'newsletter' ? 'is-newsletter' : 'is-article';
  }
  if (props.item._type === 'coffeeEpisode') return 'is-episode';
  return 'is-event';
});

const dateText = computed<string>(() => {
  if (props.item._type === 'events') return formatDate(props.item.date);
  return formatDate(props.item.publishedAt);
});

const imageUrl = computed<string | null>(() => {
  if (props.item._type === 'post') return props.item.featuredImage?.asset?.url ?? null;
  if (props.item._type === 'coffeeEpisode') {
    return props.item.thumbnailUrl ?? `https://img.youtube.com/vi/${props.item.videoId}/maxresdefault.jpg`;
  }
  return props.item.image?.asset?.url ?? null;
});

const imageAlt = computed<string>(() => {
  if (props.item._type === 'post') return props.item.featuredImage?.alt || props.item.title;
  if (props.item._type === 'events') return props.item.image?.alt || props.item.title;
  return props.item.title;
});

const href = computed<string>(() => {
  if (props.item._type === 'post') return `/blog/${props.item.slug.current}`;
  if (props.item._type === 'coffeeEpisode') return `https://www.youtube.com/watch?v=${props.item.videoId}`;
  return `/events/${props.item.slug.current}`;
});

const isExternal = computed(() => props.item._type === 'coffeeEpisode');

const excerptText = computed<string>(() => {
  if (props.item._type === 'post') return props.item.excerpt ?? '';
  if (props.item._type === 'events') {
    const d = props.item.description;
    if (!d) return '';
    if (typeof d === 'string') return d;
    return d
      .filter((b) => b._type === 'block')
      .map((b) => (b.children ?? []).map((s) => s.text ?? '').join(''))
      .join(' ')
      .trim();
  }
  return ''; // episodes don't carry an excerpt on the feed
});

const ctaLabel = computed<string>(() => {
  if (props.item._type === 'coffeeEpisode') return 'Watch on YouTube →';
  if (props.item._type === 'events') return 'Event details →';
  return 'Read more →';
});
</script>

<template>
  <article class="featured-card" :class="typeClass">
    <component
      :is="isExternal ? 'a' : SmartLink"
      :to="isExternal ? undefined : href"
      :href="isExternal ? href : undefined"
      :target="isExternal ? '_blank' : undefined"
      :rel="isExternal ? 'noopener noreferrer' : undefined"
      class="featured-card__link"
    >
      <div v-if="imageUrl" class="featured-card__media">
        <img :src="imageUrl" :alt="imageAlt" class="featured-card__image" loading="eager" />
        <span v-if="item._type === 'coffeeEpisode'" class="featured-card__play" aria-hidden="true">
          <svg viewBox="0 0 68 48" width="56" height="40">
            <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#FF0000"/>
            <path d="M45 24L27 14v20" fill="#fff"/>
          </svg>
        </span>
      </div>
      <div class="featured-card__body">
        <span class="featured-card__featured-flag">Featured</span>
        <div class="featured-card__meta">
          <span class="featured-card__type">{{ typeLabel }}</span>
          <time v-if="dateText" class="featured-card__date">{{ dateText }}</time>
        </div>
        <h2 class="featured-card__title">{{ item.title }}</h2>
        <p v-if="excerptText" class="featured-card__excerpt">{{ excerptText }}</p>
        <span class="featured-card__cta">{{ ctaLabel }}</span>
      </div>
    </component>
  </article>
</template>

<style scoped>
.featured-card {
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  background: white;
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.featured-card:hover {
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.featured-card__link {
  display: grid;
  grid-template-columns: 1fr;
  text-decoration: none;
  color: inherit;
}

.featured-card__media {
  position: relative;
  background: var(--jc-charcoal, #2c3531);
  aspect-ratio: 16 / 9;
}
.featured-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.featured-card__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.featured-card__body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.featured-card__featured-flag {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--jc-gold);
  margin-bottom: 0.75rem;
}

.featured-card__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.875rem;
}

.featured-card__type {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
}
.is-newsletter .featured-card__type { color: var(--jc-gold); background: rgba(202, 162, 48, 0.12); }
.is-article    .featured-card__type { color: var(--jc-deep-green); background: rgba(29, 95, 85, 0.1); }
.is-episode    .featured-card__type { color: var(--jc-green, #60b567); background: rgba(96, 181, 103, 0.12); }
.is-event      .featured-card__type { color: var(--jc-green, #60b567); background: rgba(96, 181, 103, 0.12); }

.featured-card__date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.featured-card__title {
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  margin: 0 0 1rem;
}

.featured-card__excerpt {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0 0 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-card__cta {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--jc-deep-green);
}

@media (min-width: 768px) {
  .featured-card__link {
    grid-template-columns: 1.1fr 1fr;
  }
  .featured-card__media {
    aspect-ratio: auto;
    height: 100%;
    min-height: 320px;
  }
  .featured-card__body {
    padding: 2.5rem 2.75rem;
  }
}
</style>
