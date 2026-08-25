import type { Component } from 'vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import FeatureGrid from '@/components/sections/FeatureGrid.vue'
import StatsSection from '@/components/sections/StatsSection.vue'
import ProcessSteps from '@/components/sections/ProcessSteps.vue'
import TestimonialsSection from '@/components/sections/TestimonialsSection.vue'
import PricingSection from '@/components/sections/PricingSection.vue'
import PricingCtaSection from '@/components/sections/PricingCtaSection.vue'
import FaqSection from '@/components/sections/FaqSection.vue'
import SplitSection from '@/components/sections/SplitSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import TextContent from '@/components/sections/TextContent.vue'
import PortfolioSection from '@/components/sections/PortfolioSection.vue'
import TeamProjectsSection from '@/components/sections/TeamProjectsSection.vue'
import PillarsBar from '@/components/sections/PillarsBar.vue'
import ProgramsGrid from '@/components/sections/ProgramsGrid.vue'
import OurStorySection from '@/components/sections/OurStorySection.vue'
import PartnersSection from '@/components/sections/PartnersSection.vue'
import HowYouCanHelp from '@/components/sections/HowYouCanHelp.vue'
import ProgramDonationsSection from '@/components/sections/ProgramDonationsSection.vue'
import ProgramResourcesSection from '@/components/sections/ProgramResourcesSection.vue'
import VideoSection from '@/components/sections/VideoSection.vue'
import DualCtaSection from '@/components/sections/DualCtaSection.vue'
import DiagonalTextSection from '@/components/sections/DiagonalTextSection.vue'
import PeopleGrid from '@/components/sections/PeopleGrid.vue'
import VideoGridSection from '@/components/sections/VideoGridSection.vue'
import EventsListSection from '@/components/sections/EventsListSection.vue'
import TransparencySection from '@/components/sections/TransparencySection.vue'
import PodcastEpisodesSection from '@/components/sections/PodcastEpisodesSection.vue'
import PartnershipSection from '@/components/sections/PartnershipSection.vue'
import OneTimeGiftSection from '@/components/sections/OneTimeGiftSection.vue'
import StayConnectedSection from '@/components/sections/StayConnectedSection.vue'
import LatestCoffeeChatSection from '@/components/sections/LatestCoffeeChatSection.vue'
import LatestBlogSection from '@/components/sections/LatestBlogSection.vue'
import MapEmbedSection from '@/components/sections/MapEmbedSection.vue'
import ActiveCampaignsBanner from '@/components/sections/ActiveCampaignsBanner.vue'

/** Maps section _type (from Sanity) to Vue components */
export const sectionMap: Record<string, Component> = {
  heroSection: HeroSection,
  featureGrid: FeatureGrid,
  statsSection: StatsSection,
  processSteps: ProcessSteps,
  testimonialsSection: TestimonialsSection,
  pricingSection: PricingSection,
  pricingCtaSection: PricingCtaSection,
  faqSection: FaqSection,
  splitSection: SplitSection,
  contactSection: ContactSection,
  textContent: TextContent,
  portfolioSection: PortfolioSection,
  teamProjectsSection: TeamProjectsSection,
  // Joseph Center home page sections (from 08-home-page.md)
  pillarsBar: PillarsBar,
  programsGrid: ProgramsGrid,
  ourStorySection: OurStorySection,
  partnersSection: PartnersSection,
  // Donor appeal — used by program pages directly and as a sectionMap entry
  howYouCanHelp: HowYouCanHelp,
  // Program donations + resources — used by ProgramDonationsPage directly and as sectionMap entries
  programDonationsSection: ProgramDonationsSection,
  programResourcesSection: ProgramResourcesSection,
  // Our Story page (11) sections
  videoSection: VideoSection,
  dualCtaSection: DualCtaSection,
  diagonalTextSection: DiagonalTextSection,
  // Staff & Board pages (12) section
  peopleGrid: PeopleGrid,
  // Testimonies page (13) section
  videoGridSection: VideoGridSection,
  // Events page (14) section
  eventsListSection: EventsListSection,
  // Transparency (16) section
  transparencySection: TransparencySection,
  // Media + Donate (17) sections
  podcastEpisodesSection: PodcastEpisodesSection,
  partnershipSection: PartnershipSection,
  oneTimeGiftSection: OneTimeGiftSection,
  // Stay Connected (23) — embeddable subscribe CTA
  stayConnectedSection: StayConnectedSection,
  // Coffee Chat teaser (24)
  latestCoffeeChatSection: LatestCoffeeChatSection,
  // Blog teaser — surfaces N latest posts with link to /blog
  latestBlogSection: LatestBlogSection,
  // Map embed — full-width Google Maps iframe
  mapEmbedSection: MapEmbedSection,
  // Active campaigns banner — live from Turso (hidden when no active campaigns)
  activeCampaignsBanner: ActiveCampaignsBanner,
}

/** GROQ query — just fetch the whole page document with sections */
export const pageQuery = (slug: string) =>
  `*[_type == "page" && slug.current == "${slug}"][0]{ title, "slug": slug.current, sections }`
