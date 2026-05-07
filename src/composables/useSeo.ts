import { useHead } from '@unhead/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const siteUrl = import.meta.env.VITE_SITE_URL || 'https://josephcentergj.com';
const siteName = 'Joseph Center';
const defaultImage = `${siteUrl}/og-image.png`;

const pageMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Home',
    description: 'Supporting people experiencing homelessness and poverty in Grand Junction, CO through shelter, food, financial services, housing programs, and community.',
  },
  '/about': {
    title: 'About',
    description: 'Learn about The Joseph Center\'s mission to restore dignity and provide resources and encouragement to people in need in the Grand Junction community.',
  },
  '/contact': {
    title: 'Contact',
    description: 'Contact The Joseph Center in Grand Junction, Colorado. We\'re here to connect you with the help and resources you need.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    description: 'Privacy Policy - Joseph Center',
  },
  '/terms-and-conditions': {
    title: 'Terms & Conditions',
    description: 'Terms & Conditions - Joseph Center',
  },
  '/accessibility': {
    title: 'Accessibility Statement',
    description: 'Accessibility Statement - Joseph Center',
  },
  '/donate': {
    title: 'Donate',
    description: 'Partner with The Joseph Center through a monthly partnership or one-time gift. Your generosity restores dignity and changes lives in Grand Junction, CO.',
  },
  '/board': {
    title: 'Our Board',
    description: 'Meet the board of directors who guide The Joseph Center\'s mission and ensure we serve our community with integrity and purpose.',
  },
  '/staff': {
    title: 'Our Staff',
    description: 'Meet the dedicated team at The Joseph Center who work every day to support people experiencing homelessness and poverty in Grand Junction, Colorado.',
  },
  '/testimonies': {
    title: 'Testimonies',
    description: 'Hear directly from guests of The Joseph Center — stories of hope, resilience, and new beginnings made possible by your support.',
  },
  '/events': {
    title: 'Events',
    description: 'Join The Joseph Center at upcoming events in Grand Junction. From fundraisers to community gatherings, there\'s always a way to get involved.',
  },
  '/forms/volunteer': {
    title: 'Volunteer Form',
    description: 'Sign up to volunteer with The Joseph Center in Grand Junction. Choose your department and availability — every hour you give makes a difference.',
  },
  '/forms/referral': {
    title: 'Referral Form',
    description: 'Refer an individual or family to The Joseph Center\'s programs in Grand Junction, Colorado. Complete the form and our team will follow up.',
  },
  '/transparency': {
    title: 'Transparency',
    description: 'The Joseph Center is committed to financial transparency. View our annual reports and IRS Form 990s available for public review.',
  },
  '/media': {
    title: 'Media',
    description: 'Watch and listen to Coffee Chat with Mona — honest conversations about hope, homelessness, and the people The Joseph Center is honored to serve.',
  },
  '/programs': {
    title: 'Programs',
    description: 'Explore The Joseph Center\'s programs — day shelter, food bank, housing support, financial services, and family advocacy — all serving Grand Junction, CO.',
  },
  '/events/:slug': {
    title: 'Event Detail',
    description: 'Dynamic — use event title and date: "[Event Name] at The Joseph Center — [Month Day, Year] in Grand Junction, CO. Register today and join us."',
  },
  '/programs/:slug': {
    title: 'Program Page',
    description: 'Dynamic — use program name: "[Program Name] at The Joseph Center in Grand Junction, CO. Learn how we help and how you can support our work."',
  },
  '/programs/:slug/donations': {
    title: 'Program Donations',
    description: 'Dynamic — use program name: "Support [Program Name] at The Joseph Center through event sponsorship or supply donations. Every contribution makes a direct impact."',
  },
  '/our-story': {
    title: 'Our Story',
    description: 'Founded in 2015 by Mona Highline, The Joseph Center has grown to serve hundreds of families in Grand Junction through programs rooted in dignity and hope.',
  },
};

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "Joseph Center",
  "url": "https://josephcentergj.com",
  "email": "mhighline@josephcentergj.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "2511 Belford Ave",
    "addressLocality": "Grand Junction",
    "addressRegion": "CO",
    "postalCode": "81521",
    "addressCountry": "US"
  }
};

export function useSeo() {
  const route = useRoute();

  const meta = computed(() => pageMeta[route.path] || {
    title: siteName,
    description: 'Purpose-driven solutions from ' + siteName + '.',
  });

  const fullTitle = computed(() => {
    const t = meta.value.title;
    return t.includes(siteName) ? t : `${t} | ${siteName}`;
  });

  const canonicalUrl = computed(() => `${siteUrl}${route.path === '/' ? '' : route.path}`);

  useHead({
    title: fullTitle,
    link: [
      { rel: 'canonical', href: canonicalUrl },
    ],
    meta: [
      { name: 'description', content: computed(() => meta.value.description) },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: computed(() => meta.value.description) },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: defaultImage },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: computed(() => meta.value.description) },
      { name: 'twitter:image', content: defaultImage },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schemaJsonLd),
      },
    ],
  });
}
