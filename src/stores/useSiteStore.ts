import { defineStore } from 'pinia';
import type { SiteConfig } from '@/types/site';

export const useSiteStore = defineStore('site', {
  state: (): SiteConfig => ({
    name: 'Joseph Center',
    logo: null,
    darkLogo: null,
    tagline: '',
    contactEmail: 'mhighline@josephcentergj.com',
    contactPhone: '(970) 243-7672',
    addressLine1: '2511 Belford Ave #9',
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
          { label: 'Integrated Financial Services', href: '/programs/financial-services' },
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
  }),
});
