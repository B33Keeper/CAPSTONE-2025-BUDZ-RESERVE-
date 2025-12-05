import { useState, useEffect, useRef } from 'react'
import { X, Calendar, CreditCard, CheckCircle, ArrowRight, ArrowLeft, UserPlus, MapPin, ShoppingCart, ClipboardCheck, Play } from 'lucide-react'
import { TermsAndConditionsModal } from './TermsAndConditionsModal'
import { useAuthStore } from '@/store/authStore'

interface ReservationGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

const steps = [
  {
    number: 1,
    title: 'Create Account & Login',
    description: 'First, you need to create an account if you don\'t have one yet. Click "Get Started" or "Sign Up" to register. You must read and agree to the Terms and Conditions before you can proceed with registration. After creating your account, make sure to log in. You must be logged in to make a reservation.',
    icon: UserPlus,
    color: 'blue'
  },
  {
    number: 2,
    title: 'Select Date & Time',
    description: 'Choose your preferred date and time slot for your badminton court reservation. You can select multiple time slots if needed. Before proceeding to the next step, you must read and accept the Terms and Conditions.',
    icon: Calendar,
    color: 'green'
  },
  {
    number: 3,
    title: 'Choose Your Court',
    description: 'Select the court number you want to book. Available courts will be highlighted in green.',
    icon: MapPin,
    color: 'purple'
  },
  {
    number: 4,
    title: 'Add Equipment (Optional)',
    description: 'If you need rackets or other equipment, you can add them to your reservation. Equipment rental fees will be added to your total.',
    icon: ShoppingCart,
    color: 'orange'
  },
  {
    number: 5,
    title: 'Review & Confirm',
    description: 'Review your booking details including date, time, court, and total amount. Make sure all information is correct before proceeding.',
    icon: ClipboardCheck,
    color: 'indigo'
  },
  {
    number: 6,
    title: 'Complete Payment',
    description: 'Proceed to payment using your preferred method (GCash, Maya, GrabPay, or Online Banking). Your reservation will be confirmed once payment is successful. A digital receipt will be automatically sent to your registered email address.',
    icon: CreditCard,
    color: 'teal'
  }
]

export function ReservationGuideModal({ isOpen, onClose }: ReservationGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [isTermsAccepted, setIsTermsAccepted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setShowVideo(false)
      setIsMusicPlaying(false)
      // Check if terms are already accepted
      if (user?.id) {
        const termsAccepted = localStorage.getItem(`termsAccepted_${user.id}`) === 'true'
        setIsTermsAccepted(termsAccepted)
      } else {
        setIsTermsAccepted(false)
      }
    }
    
    // Cleanup: stop music when modal closes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsMusicPlaying(false)
      }
    }
  }, [isOpen, user?.id])

  useEffect(() => {
    // Detect if user is on mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.load()
      // Don't auto-play video or music - let user control it
    } else {
      // Stop background music when video is hidden
      if (audioRef.current && isMusicPlaying) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsMusicPlaying(false)
      }
    }
  }, [showVideo, isMusicPlaying])

  // Handle video play - start background music
  const handleVideoPlay = () => {
    if (audioRef.current && !isMusicPlaying) {
      audioRef.current.volume = 0.3 // Set volume to 30% so it doesn't overpower the video
      audioRef.current.loop = true
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsMusicPlaying(true)
          })
          .catch((error) => {
            console.warn('Background music play prevented:', error)
          })
      }
    }
  }

  // Handle video end - stop background music
  const handleVideoEnd = () => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsMusicPlaying(false)
    }
  }

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('reservation-guide-disabled', 'true')
    }
    onClose()
  }

  const handleNext = () => {
    // If on step 2 (index 1) and terms not accepted, show terms modal
    if (currentStep === 1 && !isTermsAccepted) {
      setShowTermsModal(true)
      return
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleTermsAccept = () => {
    // Store acceptance in localStorage if user is logged in
    if (user?.id) {
      localStorage.setItem(`termsAccepted_${user.id}`, 'true')
    }
    setIsTermsAccepted(true)
    setShowTermsModal(false)
    // Proceed to next step (step 3)
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]
  const IconComponent = currentStepData.icon

  return (
    <>
      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccept}
        initialAccepted={isTermsAccepted}
        onAcceptedChange={setIsTermsAccepted}
      />

      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose()
          }
        }}
      >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold mb-2">How to Make a Reservation</h2>
            <p className="text-white/90 text-sm">Follow these simple steps to book your badminton court</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4 pb-2 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-xs font-semibold text-gray-600">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'bg-blue-600 scale-125'
                  : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Hidden audio element for background music */}
          <audio
            ref={audioRef}
            preload="auto"
            onEnded={() => setIsMusicPlaying(false)}
            onPlay={() => setIsMusicPlaying(true)}
            onPause={() => setIsMusicPlaying(false)}
          >
            <source src="/assets/BGmusic/Upbeat and Happy Pop Background Music For Videos.mp3" type="audio/mpeg" />
            <source src="/assets/BGmusic/Upbeat%20and%20Happy%20Pop%20Background%20Music%20For%20Videos.mp3" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          
          {showVideo ? (
            <div className="w-full">
              <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video mb-4 relative group">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay={false}
                  preload="auto"
                  playsInline
                  onPlay={handleVideoPlay}
                  onEnded={handleVideoEnd}
                  onError={(e) => {
                    console.error('Video error:', e)
                    const video = e.currentTarget
                    console.error('Video error details:', {
                      error: video.error,
                      networkState: video.networkState,
                      readyState: video.readyState,
                      src: video.src
                    })
                  }}
                >
                  <source src="/assets/BookingProcess Video guide/BookingProcess.mp4" type="video/mp4" />
                  <source src="/assets/BookingProcess%20Video%20guide/BookingProcess.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              {isMobile ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 mb-1">
                        📱 Tip: Rotate to Landscape
                      </p>
                      <p className="text-sm text-orange-700">
                        For the best viewing experience on mobile, please rotate your device to landscape mode (horizontal orientation).
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        💡 Tip: Watch in Fullscreen
                      </p>
                      <p className="text-sm text-blue-700">
                        For the best viewing experience, click the fullscreen button (⛶) in the video player controls to watch in fullscreen mode.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-center text-gray-600 text-sm">
                Watch this video guide to see the complete booking process step by step.
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                currentStepData.color === 'blue' ? 'bg-blue-100' :
                currentStepData.color === 'green' ? 'bg-green-100' :
                currentStepData.color === 'purple' ? 'bg-purple-100' :
                currentStepData.color === 'orange' ? 'bg-orange-100' :
                currentStepData.color === 'indigo' ? 'bg-indigo-100' :
                currentStepData.color === 'teal' ? 'bg-teal-100' :
                'bg-blue-100'
              }`}>
                <IconComponent className={`w-10 h-10 ${
                  currentStepData.color === 'blue' ? 'text-blue-600' :
                  currentStepData.color === 'green' ? 'text-green-600' :
                  currentStepData.color === 'purple' ? 'text-purple-600' :
                  currentStepData.color === 'orange' ? 'text-orange-600' :
                  currentStepData.color === 'indigo' ? 'text-indigo-600' :
                  currentStepData.color === 'teal' ? 'text-teal-600' :
                  'text-blue-600'
                }`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {currentStepData.number}. {currentStepData.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                {currentStepData.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          {/* Don't show again checkbox */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="dontShowAgain" className="ml-2 text-sm text-gray-700 cursor-pointer">
              Don't show this guide again
            </label>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center justify-center space-x-2 px-3 md:px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Previous"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Previous</span>
            </button>

            <div className="flex items-center space-x-2 md:space-x-3 flex-1 justify-end">
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                aria-label="Toggle video"
              >
                {showVideo ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>Hide Video</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Watch Video</span>
                  </>
                )}
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center justify-center space-x-2 px-3 md:px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  aria-label="Next"
                >
                  <span className="hidden md:inline">Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center space-x-2 px-3 md:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  aria-label="Got it"
                >
                  <span className="hidden md:inline">Got it!</span>
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

