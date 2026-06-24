<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useSiteStore } from '@/stores/useSiteStore';
import { useSanity } from '@/composables/useSanity';
import { getSocialIcon } from '@/composables/useSocialIcons';
import { useDonateButton } from '@/composables/useDonateButton';
import SmartLink from '@/components/ui/SmartLink.vue';
import FooterStayConnected from '@/components/layout/FooterStayConnected.vue';

const site = useSiteStore();
const route = useRoute();
const year = new Date().getFullYear();

// When the footer CTA band points at /donate (which it almost always does
// — "Support Our Mission"), route the click through useDonateButton so the
// platform-routing rules apply. Otherwise fall back to a regular SmartLink.
const { donateHref, donateTarget, donateRel, handleDonateClick, platform } = useDonateButton();
const isDonateCta = computed(() => {
  const url = (site.ctaFooterUrl || site.ctaUrl || '').trim();
  return url === '/donate' || url === 'donate';
});
const useExternalDonateAnchor = computed(() => platform.value !== 'stripe');

// Don't render the CTA band when the current page IS the CTA's destination
// (avoids a "Donate" button on /donate, "Contact" on /contact, etc).
const ctaTarget = computed(() => site.ctaFooterUrl || site.ctaUrl || '');
const showCtaBand = computed(() => {
  const hasLabel = !!(site.ctaFooterLabel || site.ctaLabel);
  if (!hasLabel) return false;
  const target = ctaTarget.value.trim().replace(/\/$/, '');
  const current = route.path.replace(/\/$/, '');
  return target !== current;
});

type FooterLink = { label: string; href: string };

// Fallback link lists used until a `footerColumns` doc is seeded in Sanity.
const fallbackColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Programs',
    links: [
      { label: 'Day Shelter', href: '/programs/day-shelter' },
      { label: 'Food Pantry', href: '/programs/food-pantry' },
      { label: 'Golden Girls', href: '/programs/golden-girls' },
      { label: 'Integrated Financial Services', href: '/programs/integrated-financial-services' },
      { label: 'Family Center', href: '/programs/family-center' },
      { label: 'Events', href: '/events' },
    ],
  },
  {
    title: 'About Us',
    links: [
      { label: 'Our Story', href: '/our-story' },
      { label: 'Our Board', href: '/board' },
      { label: 'Our Staff', href: '/staff' },
      { label: 'Our Guests', href: '/testimonies' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Forms',
    links: [
      { label: 'Volunteer', href: '/forms/volunteer' },
      { label: 'Referral', href: '/forms/referral' },
    ],
  },
];

const { data: footerColumnsDoc } = useSanity<{
  columns: { title?: string; links?: { label?: string; url?: string }[] }[];
}>(
  `*[_type == "footerColumns"][0]{ columns[]{ title, links[]{ label, url } } }`
);

const linkColumns = computed<{ title: string; links: FooterLink[] }[]>(() => {
  const raw = footerColumnsDoc.value?.columns;
  if (!raw || !raw.length) return fallbackColumns;
  const mapped = raw
    .map((col) => ({
      title: col.title ?? '',
      links: (col.links ?? [])
        .filter((l) => l && l.label && l.url)
        .map((l) => ({ label: l.label as string, href: l.url as string })),
    }))
    .filter((col) => col.title && col.links.length);
  return mapped.length ? mapped : fallbackColumns;
});

// Derive a tel: href from whatever phone string the store carries.
const phoneTel = computed(() => {
  const digits = (site.contactPhone || '').replace(/\D+/g, '');
  return digits ? `tel:+1${digits.replace(/^1/, '')}` : '';
});

const { data: socialDoc } = useSanity<{ links: { platform: string; url: string }[] }>(
  `*[_type == "socialLinks"][0]{"links": coalesce(links, items)}`
);
const socialLinks = computed(() => {
  const raw = socialDoc.value?.links || site.socialLinks;
  return raw.map((l) => ({ ...l, platform: l.platform.toLowerCase() }));
});

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  github: 'GitHub',
  pinterest: 'Pinterest',
  threads: 'Threads',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  nextdoor: 'Nextdoor',
};
</script>

<template>
  <footer class="site-footer">
    <!-- Section 1: CTA Band -->
    <div v-if="showCtaBand" class="cta-band">
      <div class="cta-band__inner">
        <h2 class="cta-band__heading">{{ site.ctaHeadline }}</h2>
        <p class="cta-band__text">{{ site.ctaSubtext }}</p>

        <!-- When the CTA points at /donate, route via the platform-aware
             composable. External platforms render as <a target="_blank">;
             Stripe renders as a <button> that opens the modal. -->
        <a
          v-if="isDonateCta && useExternalDonateAnchor"
          :href="donateHref"
          :target="donateTarget"
          :rel="donateRel"
          class="cta-band__button"
          @click="handleDonateClick"
        >
          {{ site.ctaFooterLabel || site.ctaLabel }}
        </a>
        <button
          v-else-if="isDonateCta"
          type="button"
          class="cta-band__button"
          @click="handleDonateClick"
        >
          {{ site.ctaFooterLabel || site.ctaLabel }}
        </button>
        <SmartLink v-else :to="site.ctaFooterUrl || site.ctaUrl" class="cta-band__button">
          {{ site.ctaFooterLabel || site.ctaLabel }}
        </SmartLink>
      </div>
    </div>

    <!-- Section 1.5: Stay Connected band -->
    <FooterStayConnected />

    <!-- Section 2: Footer columns -->
    <div class="jc-footer__columns-section">
      <div class="jc-footer__columns">
        <div v-for="col in linkColumns" :key="col.title" class="jc-footer__col">
          <h3 class="jc-footer__heading">{{ col.title }}</h3>
          <ul class="jc-footer__list">
            <li v-for="item in col.links" :key="item.href">
              <SmartLink :to="item.href" class="jc-footer__link">{{ item.label }}</SmartLink>
            </li>
          </ul>
        </div>

        <div class="jc-footer__col">
          <h3 class="jc-footer__heading">Hours</h3>
          <div class="jc-footer__text">
            <p>{{ site.hours.office.days }}<br>{{ site.hours.office.time }}</p>
            <p><strong>Day Shelter</strong><br>{{ site.hours.dayShelter.days }}<br>{{ site.hours.dayShelter.time }}</p>
          </div>
        </div>

        <div class="jc-footer__col">
          <h3 class="jc-footer__heading">Need Help?</h3>
          <div class="jc-footer__text">
            <p v-if="site.contactPhone">
              <a :href="phoneTel" class="jc-footer__link">{{ site.contactPhone }}</a>
            </p>
            <p v-if="site.addressLine1 || site.addressLine2">
              <template v-if="site.addressLine1">{{ site.addressLine1 }}<br></template>
              <template v-if="site.addressLine2">{{ site.addressLine2 }}</template>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Bottom Bar -->
    <div class="bottom-bar">
      <div class="bottom-bar__inner">
        <!-- Legal nav row -->
        <nav v-if="site.legalNav.length" class="bottom-bar__legal">
          <RouterLink
            v-for="item in site.legalNav"
            :key="item.to"
            :to="item.to"
            class="bottom-bar__legal-link"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <!-- Copyright + Social row -->
        <div class="bottom-bar__meta">
          <p class="bottom-bar__copyright">
            {{ site.copyrightText || `© ${year} ${site.name}. All rights reserved.` }}
          </p>
          <div v-if="socialLinks.length" class="bottom-bar__social">
            <a
              v-for="link in socialLinks"
              :key="link.platform"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="bottom-bar__social-link"
              :aria-label="platformLabels[link.platform] || link.platform"
            >
              <svg v-if="getSocialIcon(link.platform)" class="bottom-bar__social-svg" viewBox="0 0 24 24" fill="currentColor">
                <path :d="getSocialIcon(link.platform)!" />
              </svg>
              <span v-else class="bottom-bar__social-fallback">{{ (platformLabels[link.platform] || link.platform).charAt(0) }}</span>
            </a>
          </div>
        </div>

        <!-- Crafted-by attribution -->
        <p v-if="site.craftedBy" class="bottom-bar__crafted">
          <a
            href="https://phiferwebsolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            class="bottom-bar__crafted-link"
          >
            {{ site.craftedBy }}
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto;
}

/* ─── Section 1: CTA Band ─── */
.cta-band {
  background-color: var(--jc-deep-green);
  padding: 4rem 1.5rem;
  text-align: center;
}

.cta-band__inner {
  max-width: 48rem;
  margin: 0 auto;
}

.cta-band__heading {
  font-family: var(--font-heading);
  font-size: 1.875rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.cta-band__text {
  font-size: 1.125rem;
  color: #d1d5db;
  margin-bottom: 2rem;
}

.cta-band__button {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 2rem;
  background-color: #ffffff;
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.cta-band__button:hover {
  background-color: var(--color-accent);
  color: #111827;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.cta-band__button:focus-visible {
  outline: 3px dashed rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

/* ─── Section 2: Footer columns ─── */
.jc-footer__columns-section {
  background-color: var(--jc-charcoal);
  padding: 3.5rem 1.5rem 3rem;
}

.jc-footer__columns {
  max-width: 72rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2rem;
}

.jc-footer__col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.jc-footer__heading {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: white;
  margin: 0 0 0.25rem;
}

.jc-footer__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.jc-footer__link {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  line-height: 1.4;
  transition: color 150ms ease;
}
.jc-footer__link:hover {
  color: white;
}

.jc-footer__text {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.jc-footer__text p {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0;
}

/* ─── Section 3: Bottom Bar ─── */
.bottom-bar {
  background-color: var(--jc-charcoal);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1.25rem 1.5rem;
}

.bottom-bar__inner {
  max-width: 72rem;
  margin: 0 auto;
}

/* Legal nav row */
.bottom-bar__legal {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 0.75rem;
}

.bottom-bar__legal-link {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.2s ease;
  border-radius: 2px;
}

.bottom-bar__legal-link:hover {
  color: white;
}

.bottom-bar__legal-link:focus-visible {
  outline: 3px dashed rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

/* Copyright + Social row */
.bottom-bar__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.bottom-bar__copyright {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.6);
}

.bottom-bar__crafted {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin: 0.75rem 0 0;
}

.bottom-bar__crafted-link {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dotted rgba(255, 255, 255, 0.4);
  transition: color 150ms ease, border-color 150ms ease;
}

.bottom-bar__crafted-link:hover {
  color: rgba(255, 255, 255, 0.85);
  border-bottom-color: rgba(255, 255, 255, 0.85);
}

.bottom-bar__crafted-link:focus-visible {
  outline: 2px dashed rgba(255, 255, 255, 0.7);
  outline-offset: 3px;
  border-radius: 2px;
}

.bottom-bar__social {
  display: flex;
  gap: 1.25rem;
}

.bottom-bar__social-link {
  display: inline-flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.75);
  transition: color 0.2s ease, transform 150ms ease;
  border-radius: 4px;
}

.bottom-bar__social-link:hover {
  color: white;
  transform: translateY(-2px);
}

.bottom-bar__social-link:focus-visible {
  outline: 3px dashed rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

.bottom-bar__social-svg {
  width: 1.25rem;
  height: 1.25rem;
}

.bottom-bar__social-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.8125rem;
  font-weight: 700;
}

/* ─── Responsive ─── */
@media (max-width: 1023px) {
  .jc-footer__columns {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .cta-band__heading {
    font-size: 1.5rem;
  }

  .bottom-bar__meta {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 767px) {
  .jc-footer__columns {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
