<script setup lang="ts">
import { computed } from 'vue';
import { useSanity } from '@/composables/useSanity';
import SmartLink from '@/components/ui/SmartLink.vue';
import { sanityImage } from '@/composables/useSanityImage';
import type { SanityImageSource } from '@/types/site';

type ImageWithAlt = SanityImageSource & { alt?: string | null };

interface Section {
  heading?: string;
  subtext?: string;
  postCount?: number;
  ctaLabel?: string;
}

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string | null;
  publishedAt: string;
  postType?: 'newsletter' | 'manual';
  featuredImage?: ImageWithAlt | null;
}

const props = defineProps<{ section?: Section | null }>();

const heading = computed(() => props.section?.heading || 'Latest from the Blog');
const subtext = computed(
  () =>
    props.section?.subtext ||
    'Stories, updates, and newsletters from The Joseph Center community.'
);
const ctaLabel = computed(() => props.section?.ctaLabel || 'Read All Posts →');
const postCount = computed(() => Math.min(Math.max(props.section?.postCount ?? 3, 1), 6));

// Fetch one extra so a future "View Featured Story" pull never starves the grid.
// featuredImage is returned as the raw inline object (asset ref + hotspot +
// crop + alt) so sanityImage() can honor the editor's crop/hotspot.
const query = computed(
  () => `*[_type == "post"] | order(publishedAt desc)[0...${postCount.value}]{
    _id, title, slug, excerpt, publishedAt, postType,
    featuredImage
  }`
);

const { data: posts, loading } = useSanity<Post[]>(query.value);

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function typeLabel(t?: string): string {
  return t === 'newsletter' ? 'Newsletter' : 'Article';
}

// 600x340 ≈ 16:9 at 2x density for a typical home-page teaser card.
function cardImageUrl(img: ImageWithAlt): string {
  return sanityImage(img).width(600).height(340).fit('crop').auto('format').url();
}
</script>

<template>
  <section class="latest-blog">
    <div class="latest-blog__inner">
      <header class="latest-blog__header">
        <h2 class="latest-blog__heading">{{ heading }}</h2>
        <p v-if="subtext" class="latest-blog__subtext">{{ subtext }}</p>
      </header>

      <div v-if="loading" class="latest-blog__state">Loading…</div>

      <div v-else-if="!posts || !posts.length" class="latest-blog__state">
        <p>New stories coming soon.</p>
        <SmartLink to="/blog" class="btn-primary">{{ ctaLabel }}</SmartLink>
      </div>

      <template v-else>
        <ul class="latest-blog__grid" role="list">
          <li v-for="post in posts" :key="post._id" class="latest-blog__cell">
            <SmartLink
              :to="`/blog/${post.slug.current}`"
              class="latest-blog__card"
              :class="post.postType === 'newsletter' ? 'is-newsletter' : 'is-article'"
            >
              <div v-if="post.featuredImage?.asset" class="latest-blog__media">
                <img
                  :src="cardImageUrl(post.featuredImage)"
                  :alt="post.featuredImage.alt || post.title"
                  class="latest-blog__image"
                  loading="lazy"
                />
              </div>
              <div v-else class="latest-blog__media latest-blog__media--placeholder" aria-hidden="true" />

              <div class="latest-blog__body">
                <div class="latest-blog__meta">
                  <span class="latest-blog__type">{{ typeLabel(post.postType) }}</span>
                  <time class="latest-blog__date">{{ formatDate(post.publishedAt) }}</time>
                </div>
                <h3 class="latest-blog__title">{{ post.title }}</h3>
                <p v-if="post.excerpt" class="latest-blog__excerpt">{{ post.excerpt }}</p>
                <span class="latest-blog__cta">Read more →</span>
              </div>
            </SmartLink>
          </li>
        </ul>

        <div class="latest-blog__footer">
          <SmartLink to="/blog" class="btn-primary">{{ ctaLabel }}</SmartLink>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.latest-blog {
  padding: 4rem 1.5rem;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border, #e0d8c5);
}

.latest-blog__inner {
  max-width: 1200px;
  margin: 0 auto;
}

.latest-blog__header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.latest-blog__heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.latest-blog__subtext {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 auto;
  max-width: 640px;
}

.latest-blog__state {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-muted);
}

.latest-blog__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

@media (min-width: 700px) {
  .latest-blog__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem;
  }
}
@media (min-width: 1024px) {
  .latest-blog__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.latest-blog__card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.latest-blog__card:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.latest-blog__media {
  aspect-ratio: 16 / 9;
  background: var(--jc-charcoal, #2c3531);
  overflow: hidden;
}
.latest-blog__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.latest-blog__media--placeholder {
  background: linear-gradient(135deg, var(--jc-deep-green) 0%, var(--jc-charcoal, #2c3531) 100%);
}

.latest-blog__body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.latest-blog__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.latest-blog__type {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}
.is-newsletter .latest-blog__type {
  color: var(--jc-gold);
  background: rgba(202, 162, 48, 0.12);
}
.is-article .latest-blog__type {
  color: var(--jc-deep-green);
  background: rgba(29, 95, 85, 0.1);
}

.latest-blog__date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.latest-blog__title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
  margin: 0 0 0.625rem;
}

.latest-blog__excerpt {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.latest-blog__cta {
  margin-top: auto;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--jc-deep-green);
}

.latest-blog__footer {
  display: flex;
  justify-content: center;
  margin-top: 2.5rem;
}
</style>
