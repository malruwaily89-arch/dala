import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { Categories } from '@/components/categories'
import { HowItWorks } from '@/components/how-it-works'
import { FeaturedSalons } from '@/components/featured-salons'
import { Testimonials } from '@/components/testimonials'
import { PartnerCta } from '@/components/partner-cta'
import { SiteFooter } from '@/components/site-footer'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <Categories />
        <HowItWorks />
        <FeaturedSalons />
        <Testimonials />
        <PartnerCta />
      </main>
      <SiteFooter />
    </div>
  )
}
