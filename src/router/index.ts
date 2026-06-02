import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('@/pages/Home.vue');
// About.vue retained as a file in case anything imports it directly, but the
// /about route now redirects to /our-story — there's no standalone About page.
// See 16-contact-transparency-about.md.
const Contact = () => import('@/pages/Contact.vue');
const PrivacyPolicy = () => import('@/components/layout/LegalPage.vue');
const TermsAndConditions = () => import('@/components/layout/LegalPage.vue');
const Accessibility = () => import('@/components/layout/LegalPage.vue');
const CookiePolicy = () => import('@/components/layout/LegalPage.vue');
const Donate = () => import('@/pages/Donate.vue');
const Board = () => import('@/pages/Board.vue');
const Staff = () => import('@/pages/Staff.vue');
const Testimonies = () => import('@/pages/Testimonies.vue');
const Events = () => import('@/pages/Events.vue');
const FormsVolunteer = () => import('@/pages/FormsVolunteer.vue');
const FormsReferral = () => import('@/pages/FormsReferral.vue');
const FormsDynamic = () => import('@/pages/FormsDynamic.vue');
const FormsPersonalLetter = () => import('@/pages/FormsPersonalLetter.vue');
const FormsStayConnected = () => import('@/pages/FormsStayConnected.vue');
const FormsCoffeeChatGuest = () => import('@/pages/FormsCoffeeChatGuest.vue');
const Transparency = () => import('@/pages/Transparency.vue');
const Media = () => import('@/pages/Media.vue');
const Programs = () => import('@/pages/Programs.vue');
const EventsSlug = () => import('@/pages/Events:slug.vue');
const EventDonations = () => import('@/pages/EventDonationsPage.vue');
const ProgramPage = () => import('@/pages/ProgramPage.vue');
const ProgramsSlugDonations = () => import('@/pages/Programs:slugDonations.vue');
const OurStory = () => import('@/pages/OurStory.vue');
const ProjectDetail = () => import('@/pages/ProjectDetail.vue');
const TeamProjectDetail = () => import('@/pages/TeamProjectDetail.vue');
const NotFound = () => import('@/pages/NotFound.vue');

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/about',
    redirect: '/our-story',
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact,
  },
  {
    path: '/privacy-policy',
    name: 'Privacy Policy',
    component: PrivacyPolicy,
  },
  {
    path: '/terms-and-conditions',
    name: 'Terms & Conditions',
    component: TermsAndConditions,
  },
  {
    path: '/accessibility',
    name: 'Accessibility Statement',
    component: Accessibility,
  },
  {
    path: '/cookie-policy',
    name: 'Cookie Policy',
    component: CookiePolicy,
  },
  {
    path: '/donate',
    name: 'Donate',
    component: Donate,
  },
  {
    path: '/board',
    name: 'Our Board',
    component: Board,
  },
  {
    path: '/staff',
    name: 'Our Staff',
    component: Staff,
  },
  {
    path: '/testimonies',
    name: 'Testimonies',
    component: Testimonies,
  },
  {
    path: '/events',
    name: 'Events',
    component: Events,
  },
  {
    path: '/forms/volunteer',
    name: 'Volunteer Form',
    component: FormsVolunteer,
  },
  {
    path: '/forms/referral',
    name: 'Referral Form',
    component: FormsReferral,
  },
  {
    path: '/forms/easter-basket',
    name: 'Easter Basket Order',
    component: FormsDynamic,
    props: { formSlug: 'easter-basket-order' },
  },
  {
    path: '/forms/angel-tree',
    name: 'Christmas Angel Tree',
    component: FormsDynamic,
    props: { formSlug: 'angel-tree' },
  },
  {
    path: '/forms/personal-letter',
    name: 'Personal Letter from Mona',
    component: FormsPersonalLetter,
  },
  {
    path: '/forms/stay-connected',
    name: 'Stay Connected',
    component: FormsStayConnected,
  },
  {
    path: '/transparency',
    name: 'Transparency',
    component: Transparency,
  },
  {
    path: '/media/apply',
    name: 'Coffee Chat Guest Application',
    component: FormsCoffeeChatGuest,
  },
  {
    path: '/media',
    name: 'Media',
    component: Media,
  },
  {
    path: '/programs',
    name: 'Programs',
    component: Programs,
  },
  {
    path: '/events/donations',
    name: 'Event Donations',
    component: EventDonations,
  },
  {
    path: '/events/:slug',
    name: 'Event Detail',
    component: EventsSlug,
  },
  {
    path: '/programs/:slug',
    name: 'Program Page',
    component: ProgramPage,
    meta: { title: 'Program' },
  },
  {
    path: '/programs/:slug/donations',
    name: 'Program Donations',
    component: ProgramsSlugDonations,
  },
  {
    path: '/our-story',
    name: 'Our Story',
    component: OurStory,
  },
  {
    path: '/portfolio/:slug',
    name: 'ProjectDetail',
    component: ProjectDetail,
  },
  {
    path: '/team-projects/:slug',
    name: 'TeamProjectDetail',
    component: TeamProjectDetail,
  },
  // Short-URL redirects — for print materials, business cards, social bios,
  // etc. that point at the old/short paths.
  { path: '/referral', redirect: '/forms/referral' },
  { path: '/text', redirect: '/forms/stay-connected' },
  { path: '/newsletter', redirect: '/forms/stay-connected' },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

export default router;
