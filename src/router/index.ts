import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('@/pages/Home.vue');
const About = () => import('@/pages/About.vue');
const Contact = () => import('@/pages/Contact.vue');
const PrivacyPolicy = () => import('@/components/layout/LegalPage.vue');
const TermsAndConditions = () => import('@/components/layout/LegalPage.vue');
const Accessibility = () => import('@/components/layout/LegalPage.vue');
const Donate = () => import('@/pages/Donate.vue');
const Board = () => import('@/pages/Board.vue');
const Staff = () => import('@/pages/Staff.vue');
const Testimonies = () => import('@/pages/Testimonies.vue');
const Events = () => import('@/pages/Events.vue');
const FormsVolunteer = () => import('@/pages/FormsVolunteer.vue');
const FormsReferral = () => import('@/pages/FormsReferral.vue');
const Transparency = () => import('@/pages/Transparency.vue');
const Media = () => import('@/pages/Media.vue');
const Programs = () => import('@/pages/Programs.vue');
const Events:slug = () => import('@/pages/Events:slug.vue');
const Programs:slug = () => import('@/pages/Programs:slug.vue');
const Programs:slugDonations = () => import('@/pages/Programs:slugDonations.vue');
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
    name: 'About',
    component: About,
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
    path: '/transparency',
    name: 'Transparency',
    component: Transparency,
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
    path: '/events/:slug',
    name: 'Event Detail',
    component: Events:slug,
  },
  {
    path: '/programs/:slug',
    name: 'Program Page',
    component: Programs:slug,
  },
  {
    path: '/programs/:slug/donations',
    name: 'Program Donations',
    component: Programs:slugDonations,
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
