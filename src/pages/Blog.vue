<script setup lang="ts">
import { computed } from 'vue';
import { useHead } from '@unhead/vue';
import { useSanity } from '@/composables/useSanity';
import BlogPostCard from '@/components/blog/BlogPostCard.vue';
import BlogEpisodeCard from '@/components/blog/BlogEpisodeCard.vue';
import BlogEventCard from '@/components/blog/BlogEventCard.vue';

useHead({
  title: 'Blog — The Joseph Center',
  meta: [{
    name: 'description',
    content: 'News, stories, and updates from The Joseph Center on the Western Slope of Colorado.',
  }],
});

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
  _type: 'event';
  title: string;
  slug: { current: string };
  date?: string | null;
  description?: string | null;
  image?: { asset?: { url?: string }; alt?: string | null } | null;
}
type FeedItem = (PostItem | EpisodeItem | EventItem) & { feedDate: string };
interface FeedResult {
  posts: PostItem[];
  episodes: EpisodeItem[];
  events: EventItem[];
}

// Unified feed query — three types joined chronologically. Note:
//   • event schema is singular in this codebase (`event`), not `events`
//     as the original spec assumed.
//   • post.publishedAt is `date`, coffeeEpisode.publishedAt is `datetime`,
//     event.date is `date`. All compare cleanly as ISO strings.
const query = `{
  "posts": *[_type == "post"] | order(publishedAt desc) {
    _id, _type, title, slug, excerpt, publishedAt, postType,
    featuredImage{ asset->{ url }, alt },
    "authorName": author->name,
    "authorIsOrg": author->isOrg
  },
  "episodes": *[_type == "coffeeEpisode"] | order(publishedAt desc) [0..11] {
    _id, _type, title, videoId, thumbnailUrl, publishedAt, episodeNumber
  },
  "events": *[_type == "event"] | order(date desc) [0..5] {
    _id, _type, title, slug, date, description, image{ asset->{ url }, alt }
  }
}`;

const { data, loading } = useSanity<FeedResult>(query);

const feed = computed<FeedItem[]>(() => {
  if (!data.value) return [];
  const posts = (data.value.posts ?? []).map((p) => ({ ...p, feedDate: p.publishedAt }));
  const episodes = (data.value.episodes ?? []).map((e) => ({ ...e, feedDate: e.publishedAt }));
  const events = (data.value.events ?? []).map((ev) => ({ ...ev, feedDate: ev.date ?? '' }));
  return [...posts, ...episodes, ...events]
    .filter((item) => item.feedDate)
    .sort((a, b) => new Date(b.feedDate).getTime() - new Date(a.feedDate).getTime()) as FeedItem[];
});
</script>

<template>
  <main class="page page--blog">
    <div class="form-banner">
      <h1 class="form-banner__title">Blog</h1>
    </div>

    <div class="blog-page__body">
      <div v-if="loading" class="blog-page__state">
        <p>Loading…</p>
      </div>

      <div v-else-if="!feed.length" class="blog-page__state">
        <p>No posts yet — check back soon.</p>
      </div>

      <div v-else class="blog-page__feed">
        <template v-for="item in feed" :key="item._id">
          <BlogPostCard v-if="item._type === 'post'" :post="item" />
          <BlogEpisodeCard v-else-if="item._type === 'coffeeEpisode'" :episode="item" />
          <BlogEventCard v-else-if="item._type === 'event'" :event="item" />
        </template>
      </div>
    </div>
  </main>
</template>

<style scoped>
.form-banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}
.form-banner__title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.blog-page__body {
  max-width: 780px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.blog-page__feed {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.blog-page__state {
  text-align: center;
  padding: 3rem 0;
  color: var(--color-text-muted);
}
</style>
