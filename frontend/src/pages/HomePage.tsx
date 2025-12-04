import { useState, useEffect } from 'react'
import { HeroSection } from '@/components/sections/HeroSection'
import { WhyChooseSection } from '@/components/sections/WhyChooseSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { GallerySection } from '@/components/sections/GallerySection'
import { ContactSection } from '@/components/sections/ContactSection'
import { ReservationGuideModal } from '@/components/modals/ReservationGuideModal'

export function HomePage() {
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    // Check if user has seen the guide before
    const hasSeenGuide = localStorage.getItem('reservation-guide-seen') === 'true'
    const guideDisabled = localStorage.getItem('reservation-guide-disabled') === 'true'
    
    // Show guide on first visit (if not disabled)
    if (!hasSeenGuide && !guideDisabled) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowGuide(true)
        localStorage.setItem('reservation-guide-seen', 'true')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="min-h-screen">
      <HeroSection onShowGuide={() => setShowGuide(true)} />
      <WhyChooseSection />
      <FeaturesSection />
      <GallerySection />
      <ContactSection />
      <ReservationGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  )
}
