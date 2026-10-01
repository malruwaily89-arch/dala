import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { JourneyTeaser } from '@/components/journey-teaser'
import { Categories } from '@/components/categories'
import { HowItWorks } from '@/components/how-it-works'
import { FeaturedSalons } from '@/components/featured-salons'
import { PartnerCta } from '@/components/partner-cta'
import { SiteFooter } from '@/components/site-footer'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <JourneyTeaser />
        <Categories />
        <HowItWorks />
        <FeaturedSalons />
        <PartnerCta />
      </main>
      <SiteFooter />
    </div>
  )
}
