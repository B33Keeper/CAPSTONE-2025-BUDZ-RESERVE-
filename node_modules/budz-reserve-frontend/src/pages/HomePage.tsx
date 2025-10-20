import { HeroSection } from '@/components/sections/HeroSection'
import { WhyChooseSection } from '@/components/sections/WhyChooseSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { GallerySection } from '@/components/sections/GallerySection'
import { ContactSection } from '@/components/sections/ContactSection'

export function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <WhyChooseSection />
      <FeaturesSection />
      <GallerySection />
      <ContactSection />
    </div>
  )
}
