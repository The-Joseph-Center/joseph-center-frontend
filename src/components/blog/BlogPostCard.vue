<script setup lang="ts">
import SmartLink from '@/components/ui/SmartLink.vue';

defineProps<{
  post: {
    _id: string;
    title: string;
    slug: { current: string };
    excerpt?: string | null;
    publishedAt: string;
    postType?: 'newsletter' | 'manual';
    featuredImage?: { asset?: { url?: string }; alt?: string | null } | null;
    authorName?: string | null;
    authorIsOrg?: boolean;
  };
}>();

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
</script>

<template>
  <article
    class="blog-post-card"
    :class="post.postType === 'newsletter' ? 'is-newsletter' : 'is-article'"
  >
    <SmartLink :to="`/blog/${post.slug.current}`" class="blog-post-card__link">
      <img
        v-if="post.featuredImage?.asset?.url"
        :src="post.featuredImage.asset.url"
        :alt="post.featuredImage.alt || post.title"
        class="blog-post-card__image"
        loading="lazy"
      />
      <div class="blog-post-card__body">
        <div class="blog-post-card__meta">
          <span class="blog-post-card__type">
            {{ post.postType === 'newsletter' ? 'Newsletter' : 'Article' }}
          </span>
          <time class="blog-post-card__date">{{ formatDate(post.publishedAt) }}</time>
          <span v-if="post.authorName && !post.authorIsOrg" class="blog-post-card__author">
            by {{ post.authorName }}
          </span>
        </div>
        <h2 class="blog-post-card__title">{{ post.title }}</h2>
        <p v-if="post.excerpt" class="blog-post-card__excerpt">{{ post.excerpt }}</p>
        <span class="blog-post-card__read-more">Read more →</span>
      </div>
    </SmartLink>
  </article>
</template>

<style scoped>
.blog-post-card {
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.5rem);
  overflow: hidden;
  background: white;
  transition: box-shadow 200ms ease;
}
.blog-post-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }

.blog-post-card__link { display: block; text-decoration: none; color: inherit; }

.blog-post-card__image {
  width: 100%;
  aspect-ratio: 16 / 6;
  object-fit: cover;
  display: block;
}

.blog-post-card__body { padding: 1.5rem; }

.blog-post-card__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.blog-post-card__type {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}
.is-newsletter .blog-post-card__type {
  color: var(--jc-gold);
  background: rgba(202, 162, 48, 0.12);
}
.is-article .blog-post-card__type {
  color: var(--jc-deep-green);
  background: rgba(29, 95, 85, 0.1);
}

.blog-post-card__date,
.blog-post-card__author {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.blog-post-card__title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.625rem;
  line-height: 1.3;
}

.blog-post-card__excerpt {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-post-card__read-more {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--jc-deep-green);
}
</style>
