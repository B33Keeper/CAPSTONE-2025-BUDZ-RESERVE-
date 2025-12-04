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
      <HeroSection />
      <WhyChooseSection />
      <FeaturesSection />
      <GallerySection />
      <ContactSection />
      
      {/* Floating "How it Works" Button - Lower Left */}
      <button
        onClick={() => setShowGuide(true)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-110 group"
        aria-label="How it Works"
      >
        <svg 
          className="w-7 h-7 text-white group-hover:text-white transition-colors duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </button>
      
      <ReservationGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  )
}
