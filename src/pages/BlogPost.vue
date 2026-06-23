<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { PortableText } from '@portabletext/vue';
import type { TypedObject } from '@portabletext/types';
import { useSanity } from '@/composables/useSanity';
import SmartLink from '@/components/ui/SmartLink.vue';

interface RelatedResource {
  _id: string;
  title: string;
  url: string;
  description?: string | null;
  category?: string;
}

interface Post {
  title: string;
  publishedAt: string;
  postType?: 'newsletter' | 'manual';
  excerpt?: string | null;
  featuredImage?: { asset?: { url?: string }; alt?: string | null } | null;
  authorName?: string | null;
  authorIsOrg?: boolean;
  authorAvatar?: string | null;
  body?: TypedObject[];
  tags?: string[];
  relatedResources?: RelatedResource[];
}

const route = useRoute();
const router = useRouter();

const query = `*[_type == "post" && slug.current == $slug][0]{
  title, publishedAt, postType, excerpt,
  featuredImage{ asset->{ url }, alt },
  "authorName": author->name,
  "authorIsOrg": author->isOrg,
  "authorAvatar": author->avatar.asset->url,
  body,
  tags,
  relatedResources[]->{ _id, title, url, description, category }
}`;

const slugRef = computed(() => route.params.slug as string);
const { data: post, loading } = useSanity<Post | null>(query, { slug: slugRef.value });

// Redirect to /blog if the slug doesn't resolve once loading finishes.
watch([post, loading], ([val, isLoading]) => {
  if (!isLoading && val === null) router.push('/blog');
});

watchEffect(() => {
  if (post.value) {
    useHead({
      title: `${post.value.title} — The Joseph Center`,
      meta: [{ name: 'description', content: post.value.excerpt ?? '' }],
    });
  }
});

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
</script>

<template>
  <main class="page page--blog-post">
    <div v-if="loading" class="blog-post-page__state">
      <p>Loading…</p>
    </div>

    <article v-else-if="post" class="blog-post-page">
      <div class="blog-post-page__inner">
        <SmartLink to="/blog" class="blog-post-page__back">← Back to Blog</SmartLink>

        <header class="blog-post-page__header">
          <div class="blog-post-page__meta">
            <span class="blog-post-page__type">
              {{ post.postType === 'newsletter' ? 'Newsletter' : 'Article' }}
            </span>
            <time class="blog-post-page__date">{{ formatDate(post.publishedAt) }}</time>
            <span v-if="post.authorName && !post.authorIsOrg" class="blog-post-page__author">
              by {{ post.authorName }}
            </span>
          </div>
          <h1 class="blog-post-page__title">{{ post.title }}</h1>
          <p v-if="post.excerpt" class="blog-post-page__excerpt">{{ post.excerpt }}</p>
        </header>

        <img
          v-if="post.featuredImage?.asset?.url"
          :src="post.featuredImage.asset.url"
          :alt="post.featuredImage.alt || post.title"
          class="blog-post-page__image"
          loading="eager"
        />

        <div class="blog-post-page__body prose">
          <PortableText v-if="post.body" :value="post.body" />
        </div>

        <aside v-if="post.relatedResources?.length" class="blog-post-page__resources">
          <h3 class="blog-post-page__resources-heading">Related Resources</h3>
          <ul class="blog-post-page__resources-list">
            <li v-for="resource in post.relatedResources" :key="resource._id">
              <a :href="resource.url" target="_blank" rel="noopener noreferrer">
                {{ resource.title }}
              </a>
              <span v-if="resource.description" class="blog-post-page__resource-desc">
                — {{ resource.description }}
              </span>
            </li>
          </ul>
        </aside>

        <div v-if="post.tags?.length" class="blog-post-page__tags">
          <span v-for="tag in post.tags" :key="tag" class="blog-post-page__tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </article>
  </main>
</template>

<style scoped>
.blog-post-page__state {
  text-align: center;
  padding: 4rem 0;
  color: var(--color-text-muted);
}

.blog-post-page__inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.blog-post-page__back {
  display: inline-block;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 2rem;
}
.blog-post-page__back:hover { color: var(--jc-deep-green); }

.blog-post-page__header { margin-bottom: 2rem; }

.blog-post-page__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.blog-post-page__type {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--jc-gold);
}

.blog-post-page__date,
.blog-post-page__author {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.blog-post-page__title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl, 2.25rem);
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.2;
  margin: 0 0 1rem;
}

.blog-post-page__excerpt {
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.6;
  margin: 0;
}

.blog-post-page__image {
  width: 100%;
  aspect-ratio: 16 / 7;
  object-fit: cover;
  border-radius: var(--radius-card, 0.5rem);
  margin-bottom: 2.5rem;
}

.blog-post-page__body :deep(p) {
  font-size: var(--text-base);
  line-height: 1.8;
  margin: 0 0 1.25rem;
  color: var(--color-text);
}
.blog-post-page__body :deep(h2) {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 2rem 0 0.75rem;
}
.blog-post-page__body :deep(h3) {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 1.5rem 0 0.5rem;
}
.blog-post-page__body :deep(ul) {
  list-style: disc outside;
  padding-left: 1.5rem;
  margin: 0 0 1.25rem;
}
.blog-post-page__body :deep(ol) {
  list-style: decimal outside;
  padding-left: 1.5rem;
  margin: 0 0 1.25rem;
}
.blog-post-page__body :deep(li) {
  display: list-item;
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.75;
  margin-bottom: 0.375rem;
}
.blog-post-page__body :deep(a) {
  color: var(--jc-deep-green);
  text-decoration: underline;
}
.blog-post-page__body :deep(strong) { color: var(--color-text); font-weight: 700; }
.blog-post-page__body :deep(img) {
  width: 100%;
  border-radius: var(--radius-card, 0.5rem);
  margin: 1.5rem 0;
}

.blog-post-page__resources {
  margin-top: 3rem;
  padding: 1.5rem;
  background: var(--color-bg-secondary, var(--color-bg));
  border-radius: var(--radius-card, 0.5rem);
  border-left: 4px solid var(--jc-gold);
}
.blog-post-page__resources-heading {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem;
}
.blog-post-page__resources-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.blog-post-page__resources-list a {
  color: var(--jc-deep-green);
  font-weight: 600;
  font-size: var(--text-sm);
}
.blog-post-page__resource-desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-left: 0.25rem;
}

.blog-post-page__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 2rem;
}
.blog-post-page__tag {
  font-size: var(--text-xs);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: var(--color-bg-subtle, #f4f1ea);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border, #e0d8c5);
}
</style>
