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
    if (isLoading) {
      return
    }

    // Check if user has disabled the guide
    const guideDisabled = localStorage.getItem('reservation-guide-disabled') === 'true'
    if (guideDisabled) {
      setShowGuide(false)
      return
    }

    // Automatically show guide if user is not logged in (on all devices - mobile and desktop)
    // This will trigger when:
    // 1. Auth check completes (isLoading becomes false)
    // 2. User is not authenticated
    if (!isAuthenticated) {
      // Show guide on both mobile and desktop
      // Small delay to ensure page is fully loaded and rendered
      const timer = setTimeout(() => {
        setShowGuide(true)
      }, 1500) // Delay to ensure smooth page load
      return () => clearTimeout(timer)
    } else {
      // If user is logged in, hide the guide
      setShowGuide(false)
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
