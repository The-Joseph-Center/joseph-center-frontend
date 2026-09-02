import { defineStore } from 'pinia';
import type { SiteConfig, CampaignOverlay, HeaderNavItem } from '@/types/site';

export const useSiteStore = defineStore('site', {
  state: (): SiteConfig => ({
    name: 'Joseph Center',
    logo: null,
    darkLogo: null,
    tagline: '',
    contactEmail: 'mhighline@josephcentergj.com',
    contactPhone: '(970) 245-7672',
    addressLine1: '2511 Belford Ave Ste B',
    addressLine2: 'Grand Junction, CO 81501',
    hours: {
      office: { days: 'Monday – Friday', time: '8:00am – 5:00pm' },
      dayShelter: { days: 'Mon – Sat', time: '8:00am – 3:00pm' },
    },
    ctaLabel: '',
    ctaUrl: '/contact',
    ctaHeadline: 'Ready to get started?',
    ctaSubtext: 'Let\'s build something great together.',
    ctaFooterLabel: '',
    ctaFooterUrl: '',
    copyrightText: '',
    craftedBy: 'Crafted by Phifer Web Solutions',
    primaryNav: [
      { label: 'Home', to: '/' },
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Media', to: '/media' },
      { label: 'Programs', to: '/programs' },
      { label: 'Resources', to: '/resources' },
      { label: 'Blog', to: '/blog' },
      { label: 'Our Story', to: '/our-story' },
    ],
    footerNav: [
      { label: 'Our Board', to: '/board' },
      { label: 'Our Staff', to: '/staff' },
      { label: 'Testimonies', to: '/testimonies' },
      { label: 'Events', to: '/events' },
      { label: 'Transparency', to: '/transparency' },
    ],
    legalNav: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
      { label: 'Accessibility Statement', to: '/accessibility' },
    ],
    socialLinks: [],
    headerNav: [
      { label: 'Home', href: '/' },
      {
        label: 'About',
        children: [
          { label: 'Our Story', href: '/our-story' },
          { label: 'Board', href: '/board' },
          { label: 'Testimonials', href: '/testimonies' },
        ],
      },
      {
        label: 'Programs',
        children: [
          { label: 'Day Shelter', href: '/programs/day-shelter' },
          { label: 'Food Pantry', href: '/programs/food-pantry' },
          { label: 'Golden Girls', href: '/programs/golden-girls' },
          { label: 'Integrated Financial Services', href: '/programs/integrated-financial-services' },
          { label: 'Family Center', href: '/programs/family-center' },
        ],
      },
      {
        label: 'Forms',
        children: [
          { label: 'Volunteer', href: '/forms/volunteer' },
          { label: 'Referral', href: '/forms/referral' },
        ],
      },
      { label: 'Contact', href: '/contact' },
      { label: 'Resources', href: '/resources' },
      { label: 'Blog', href: '/blog' },
      {
        // NOTE: this list is the one the header actually renders. The Sanity
        // `navigation` doc with navType 'main' populates `primaryNav`, which no
        // header reads — editing the main nav in Studio has no visible effect.
        label: 'Partner With Us',
        children: [
          { label: 'Donate', href: '/donate' },
          // Donor Portal is injected by the headerNavResolved getter when the
          // URL is configured, so it cannot appear as a dead link.
          { label: 'Events', href: '/events' },
          { label: 'Transparency', href: '/transparency' },
        ],
      },
    ],
    volunteerUrl: '/forms/volunteer',
    donate: { enabled: false, mode: 'external' },
    donationConfig: null,
  }),
  getters: {
    // Returns the campaign overlay when it's both enabled AND inside its
    // [startsAt, expiresAt] window. Null otherwise.
    activeCampaignOverlay(): CampaignOverlay | null {
      const overlay = this.donationConfig?.campaignOverlay;
      if (!overlay?.enabled) return null;
      const now = new Date();
      if (overlay.startsAt && now < new Date(overlay.startsAt)) return null;
      if (overlay.expiresAt && now > new Date(overlay.expiresAt)) return null;
      return overlay;
    },
    /**
     * headerNav with the Donor Portal slotted under "Partner With Us".
     *
     * Injected rather than hardcoded because the URL lives in Sanity
     * (donationConfig.donorPortalUrl) and is blank until an admin sets it —
     * a static entry would render a dead link in the meantime.
     */
    headerNavResolved(): HeaderNavItem[] {
      const portal = this.donationConfig?.donorPortalUrl?.trim();
      if (!portal) return this.headerNav ?? [];
      return (this.headerNav ?? []).map((item) => {
        if (item.label !== 'Partner With Us' || !item.children) return item;
        if (item.children.some((c) => c.label === 'Donor Portal')) return item;
        // Last in the group, deliberately not under Donate. They look alike and
        // are opposite actions: Donate is for anyone, the portal is account
        // management for people who already give. Sitting together, the pair
        // reads like a sign-in wall in front of giving, and a first-time
        // visitor scanning for "Donate" can land on the wrong one.
        const children = [...item.children, {
          label: 'Donor Portal',
          href: portal,
          isExternal: true,
        }];
        return { ...item, children };
      });
    },
    // Every Give button routes to the on-site flow. Kept as a getter so the
    // path stays defined in exactly one place.
    donateUrl(): string {
      return '/donate';
    },
    // Stripe Customer Portal login link, for existing monthly donors to update
    // their card, change their amount, or cancel. Empty until the URL is set in
    // Studio — consumers hide the link rather than render a dead one.
    donorPortalUrl(): string {
      return this.donationConfig?.donorPortalUrl?.trim() || '';
    },
  },
});
