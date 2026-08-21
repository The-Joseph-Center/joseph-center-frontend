<script setup lang="ts">
import { computed, watch } from 'vue';
import SiteHeader from './SiteHeader.vue';
import SiteFooter from './SiteFooter.vue';
import DonateFab from '@/components/donate/DonateFab.vue';
import DonateModal from '@/components/donate/DonateModal.vue';
import { useSeo } from '@/composables/useSeo';
import { useSanity } from '@/composables/useSanity';
import { useSiteStore } from '@/stores/useSiteStore';
import type { DonationConfig } from '@/types/site';

useSeo();

// Fetch site settings and navigation from Sanity, sync into the Pinia store
const site = useSiteStore();

// ── Site Settings ──
import type { SanityImageSource } from '@/types/site';

interface SiteSettings {
  siteName?: string;
  logo?: SanityImageSource;
  darkLogo?: SanityImageSource;
  ctaLabel?: string;
  ctaUrl?: string;
  ctaHeadline?: string;
  ctaSubtext?: string;
  ctaFooterLabel?: string;
  ctaFooterUrl?: string;
  copyrightText?: string;
  craftedBy?: string;
  businessContact?: {
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
  };
  hours?: {
    office?: { days?: string; time?: string };
    dayShelter?: { days?: string; time?: string };
  };
  donate?: {
    enabled?: boolean;
    mode?: 'internal' | 'external';
    externalUrl?: string;
  };
  donationConfig?: DonationConfig | null;
}

const { data: settings, loading: settingsLoading } = useSanity<SiteSettings>(
  `*[_type == "siteSettings"][0]{
    siteName,
    logo,
    darkLogo,
    ctaLabel,
    ctaUrl,
    ctaHeadline,
    ctaSubtext,
    ctaFooterLabel,
    ctaFooterUrl,
    copyrightText,
    craftedBy,
    businessContact{ phone, addressLine1, addressLine2 },
    hours{
      office{ days, time },
      dayShelter{ days, time }
    },
    donate{ enabled, mode, externalUrl },
    donationConfig{
      campaignName,
      donorPortalUrl,
      campaignOverlay{ enabled, campaignName, campaignUrl, badgeText, description, startsAt, expiresAt }
    }
  }`
);

watch(settings, (s) => {
  if (!s) return;
  if (s.siteName) site.name = s.siteName;
  if (s.logo) site.logo = s.logo;
  if (s.darkLogo) site.darkLogo = s.darkLogo;
  if (s.ctaLabel) site.ctaLabel = s.ctaLabel;
  if (s.ctaUrl) site.ctaUrl = s.ctaUrl;
  if (s.ctaHeadline) site.ctaHeadline = s.ctaHeadline;
  if (s.ctaSubtext) site.ctaSubtext = s.ctaSubtext;
  if (s.ctaFooterLabel) site.ctaFooterLabel = s.ctaFooterLabel;
  if (s.ctaFooterUrl) site.ctaFooterUrl = s.ctaFooterUrl;
  if (s.copyrightText) site.copyrightText = s.copyrightText;
  if (s.craftedBy) site.craftedBy = s.craftedBy;
  if (s.businessContact?.phone) site.contactPhone = s.businessContact.phone;
  if (s.businessContact?.addressLine1) site.addressLine1 = s.businessContact.addressLine1;
  if (s.businessContact?.addressLine2) site.addressLine2 = s.businessContact.addressLine2;
  if (s.hours?.office?.days) site.hours.office.days = s.hours.office.days;
  if (s.hours?.office?.time) site.hours.office.time = s.hours.office.time;
  if (s.hours?.dayShelter?.days) site.hours.dayShelter.days = s.hours.dayShelter.days;
  if (s.hours?.dayShelter?.time) site.hours.dayShelter.time = s.hours.dayShelter.time;
  if (s.donate) {
    site.donate = {
      enabled: s.donate.enabled ?? false,
      mode: s.donate.mode ?? 'external',
      externalUrl: s.donate.externalUrl,
    };
  }
  if (s.donationConfig) {
    site.donationConfig = s.donationConfig;
  }
});

// ── Navigation ──
interface NavItem { label: string; url: string; isExternal?: boolean }
interface NavDoc { navType: string; items: NavItem[] }

const { data: navDocs, loading: navLoading } = useSanity<NavDoc[]>(
  `*[_type == "navigation"]{navType, items[]{label, url, isExternal}}`
);

watch(navDocs, (docs) => {
  if (!docs) return;
  for (const doc of docs) {
    const items = (doc.items || []).map((i) => ({ label: i.label, to: i.url }));
    if (doc.navType === 'main' && items.length) site.primaryNav = items;
    if (doc.navType === 'footer' && items.length) site.footerNav = items;
    if (doc.navType === 'legal' && items.length) site.legalNav = items;
  }
});

const ready = computed(() => !settingsLoading.value && !navLoading.value);
</script>

<template>
  <div v-if="!ready" class="site-loader" aria-label="Loading">
    <div class="site-loader__ring"></div>
  </div>
  <div v-else class="site-layout site-layout--ready">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <SiteHeader />
    <div id="main-content">
      <slot />
    </div>
    <SiteFooter />
    <DonateFab />
    <DonateModal />
  </div>
</template>

<style scoped>
.site-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background-color: var(--color-bg);
}

.site-loader__ring {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: loaderSpin 0.8s linear infinite;
}

@keyframes loaderSpin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .site-loader__ring {
    animation: none;
    border-top-color: var(--color-border);
    opacity: 0.5;
  }
}

.site-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  animation: layoutFadeIn 0.2s ease;
}

@keyframes layoutFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: var(--border-radius);
  z-index: 100;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 1rem;
}
</style>
