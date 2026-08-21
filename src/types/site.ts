export interface NavItem {
  label: string;
  to: string;
}

/**
 * Hierarchical nav item used by headers that support accordion / dropdown menus.
 * Items with `children` render as expandable sections; without, as direct links.
 */
export interface HeaderNavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

export interface PageMeta {
  title: string;
  description: string;
  jsonLd?: Record<string, unknown>;
}

/**
 * Loose typing for a Sanity image source. Carries the asset reference plus
 * optional crop/hotspot metadata. Pass to sanityImage() to build a URL.
 */
export interface SanityImageSource {
  _type?: 'image';
  asset?: { _ref?: string; _type?: string };
  hotspot?: { x?: number; y?: number; height?: number; width?: number };
  crop?: { top?: number; bottom?: number; left?: number; right?: number };
  [key: string]: unknown;
}

export interface HoursBlock {
  days: string;
  time: string;
}

export interface SiteHours {
  office: HoursBlock;
  dayShelter: HoursBlock;
}

export interface SiteConfig {
  name: string;
  logo: SanityImageSource | null;
  darkLogo: SanityImageSource | null;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  hours: SiteHours;
  ctaLabel: string;
  ctaUrl: string;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaFooterLabel: string;
  ctaFooterUrl: string;
  copyrightText: string;
  craftedBy: string;
  primaryNav: NavItem[];
  footerNav: NavItem[];
  legalNav: NavItem[];
  socialLinks: { platform: string; url: string }[];
  // Optional — populated when a header variant supports hierarchical nav
  // (e.g. HeaderTransparentJC with accordion sections)
  headerNav?: HeaderNavItem[];
  volunteerUrl?: string;
  donate?: DonateConfig;
  donationConfig?: DonationConfig | null;
}

export interface DonateConfig {
  enabled?: boolean;
  mode?: 'external' | 'internal';
  externalUrl?: string;
}

// Giving runs entirely through the on-site Stripe flow at /donate. The former
// platform switcher (Colorado Gives / Harness) was removed once the Colorado
// Gives campaign ended and Harness was retired.

export interface CampaignOverlay {
  enabled: boolean;
  campaignName: string;
  campaignUrl: string;
  badgeText: string;
  description: string;
  startsAt: string | null;
  expiresAt: string | null;
}

export interface DonationConfig {
  campaignName: string;
  donorPortalUrl?: string | null;
  campaignOverlay: CampaignOverlay | null;
}
