import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
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
      <motion.button
        onClick={() => setShowGuide(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center space-x-2 px-6 py-4 text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg font-semibold transition-all duration-300 group shadow-lg"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        aria-label="How it Works"
      >
        <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
        <span>How it Works</span>
      </motion.button>
      
      <ReservationGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  )
}
