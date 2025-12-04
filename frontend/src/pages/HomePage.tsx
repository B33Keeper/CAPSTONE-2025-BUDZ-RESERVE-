import { useState, useEffect } from 'react'
import { HeroSection } from '@/components/sections/HeroSection'
import { WhyChooseSection } from '@/components/sections/WhyChooseSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { GallerySection } from '@/components/sections/GallerySection'
import { ContactSection } from '@/components/sections/ContactSection'
import { ReservationGuideModal } from '@/components/modals/ReservationGuideModal'
import { useAuthStore } from '@/store/authStore'

export function HomePage() {
  const [showGuide, setShowGuide] = useState(false)
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return

    // Check if user has disabled the guide
    const guideDisabled = localStorage.getItem('reservation-guide-disabled') === 'true'
    if (guideDisabled) return

    // Automatically show guide if user is not logged in
    if (!isAuthenticated) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowGuide(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isLoading])

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
