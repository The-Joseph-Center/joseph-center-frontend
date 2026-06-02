<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '@/stores/useSiteStore';
import { sanityImage } from '@/composables/useSanityImage';
import SmartLink from '@/components/ui/SmartLink.vue';

interface Tier {
  title: string;
  badge?: string;
  description?: string;
  price?: number | null;
  ctaLabel?: string;
  ctaHref?: string;
  featured?: boolean;
}

interface Section {
  heading?: string;
  tiers?: Tier[] | null;
}

const props = defineProps<{ section?: Section | null }>();

const site = useSiteStore();

const harnessUrl =
  (import.meta.env.VITE_HARNESS_GIVING_URL as string | undefined) || '#';

const heading = computed(() => props.section?.heading || 'Partner With Us');

const defaultTiers: Tier[] = [
  {
    title: 'Monthly Partnership',
    badge: 'Supporter',
    description: 'Support The Joseph Center with a monthly contribution.',
    price: 50,
    ctaLabel: 'Subscribe',
    ctaHref: harnessUrl,
  },
  {
    title: 'Monthly Partnership',
    badge: 'Sustainer',
    description: 'Help fund a meaningful share of our daily operations every month.',
    price: 100,
    ctaLabel: 'Subscribe',
    ctaHref: harnessUrl,
  },
  {
    title: 'Monthly Partnership',
    badge: 'Premium',
    description: 'Power major programs and outreach with a leadership-level commitment.',
    price: 250,
    ctaLabel: 'Subscribe',
    ctaHref: harnessUrl,
    featured: true,
  },
  {
    title: 'A-List Partnership',
    badge: 'Premium',
    description: 'Premier partnership with maximum community impact.',
    price: null,
    ctaLabel: 'Contact Us',
    ctaHref: '/contact',
  },
];

const tiers = computed<Tier[]>(() => {
  const fromCms = props.section?.tiers?.filter((t) => t && t.title);
  return fromCms && fromCms.length ? fromCms : defaultTiers;
});

const logoSrc = computed(() => {
  if (!site.logo) return null;
  try {
    return sanityImage(site.logo).width(200).height(200).fit('crop').auto('format').url();
  } catch {
    return null;
  }
});

function priceLabel(price?: number | null) {
  return typeof price === 'number' ? `$${price}` : '';
}
</script>

<template>
  <section class="partnership">
    <div class="partnership__banner">
      <h2 class="partnership__banner-title">{{ heading }}</h2>
    </div>

    <div class="partnership__inner">
      <div class="partnership__grid">
        <div
          v-for="(tier, idx) in tiers"
          :key="idx"
          class="partnership__card"
          :class="{ 'partnership__card--featured': tier.featured }"
        >
          <div class="partnership__logo-wrap">
            <img
              v-if="logoSrc"
              :src="logoSrc"
              :alt="site.name || 'Joseph Center'"
              class="partnership__logo"
            />
            <div v-else class="partnership__logo-placeholder" aria-hidden="true" />
          </div>

          <span v-if="tier.badge" class="partnership__badge">{{ tier.badge }}</span>
          <h3 class="partnership__title">{{ tier.title }}</h3>
          <p v-if="tier.description" class="partnership__desc">{{ tier.description }}</p>

          <div class="partnership__price-row">
            <template v-if="typeof tier.price === 'number'">
              <span class="partnership__price">{{ priceLabel(tier.price) }}</span>
              <span class="partnership__price-suffix">/Mo</span>
            </template>
            <span v-else class="partnership__price-custom">Custom</span>
          </div>

          <SmartLink
            :to="tier.ctaHref || '/contact'"
            class="btn-primary partnership__cta"
          >
            {{ tier.ctaLabel || 'Subscribe' }}
          </SmartLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.partnership__banner {
  background: var(--jc-deep-green);
  padding: 1.25rem 2rem;
  text-align: center;
}

.partnership__banner-title {
  color: white;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.partnership__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
}

.partnership__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .partnership__grid {
    grid-template-columns: 1fr;
  }
}

.partnership__card {
  border: 1px solid var(--color-border, #e0d8c5);
  border-radius: var(--radius-card, 0.75rem);
  padding: 1.5rem 1.5rem 1.75rem;
  background: white;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.08));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.partnership__card--featured {
  border-color: var(--jc-gold);
  box-shadow: 0 0 0 2px var(--jc-gold), var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.08));
}

.partnership__card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover, 0 8px 20px rgba(0, 0, 0, 0.14));
}

.partnership__logo-wrap {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--jc-deep-green);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  overflow: hidden;
}

.partnership__logo {
  width: 78%;
  height: 78%;
  object-fit: contain;
}

.partnership__logo-placeholder {
  width: 100%;
  height: 100%;
  background: var(--jc-gold);
  opacity: 0.4;
}

.partnership__badge {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.partnership__title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.partnership__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 1.25rem;
  flex: 1;
}

.partnership__price-row {
  margin-bottom: 1.25rem;
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.partnership__price {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1;
}

.partnership__price-suffix {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.partnership__price-custom {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
}

.partnership__cta {
  width: 100%;
  justify-content: center;
  text-align: center;
}
</style>
