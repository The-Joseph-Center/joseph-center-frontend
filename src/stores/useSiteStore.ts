import { defineStore } from 'pinia';
import type { SiteConfig, CampaignOverlay, DonationPlatform } from '@/types/site';

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
      {
        label: 'Partner With Us',
        children: [
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
    // Resolved active platform. Defaults to 'stripe' when the Sanity config
    // hasn't loaded yet so the internal flow is the safe fallback.
    activeDonationPlatform(): DonationPlatform {
      return this.donationConfig?.activePlatform ?? 'stripe';
    },
    // Resolved donate URL/path for the current platform.
    donateUrl(): string {
      const config = this.donationConfig;
      if (!config) return '/donate';
      switch (config.activePlatform) {
        case 'colorado-gives': return config.coloradoGivesUrl || '/donate';
        case 'harness':        return config.harnessUrl || '/donate';
        case 'stripe':         return '/donate';
        default:               return '/donate';
      }
    },
  },
});
