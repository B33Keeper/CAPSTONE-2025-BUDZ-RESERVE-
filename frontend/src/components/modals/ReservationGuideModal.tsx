import { useState, useEffect } from 'react'
import { X, Calendar, Clock, CreditCard, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

interface ReservationGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

const steps = [
  {
    number: 1,
    title: 'Select Date & Time',
    description: 'Choose your preferred date and time slot for your badminton court reservation. You can select multiple time slots if needed.',
    icon: Calendar,
    color: 'blue'
  },
  {
    number: 2,
    title: 'Choose Your Court',
    description: 'Select the court number you want to book. Available courts will be highlighted in green.',
    icon: CheckCircle,
    color: 'green'
  },
  {
    number: 3,
    title: 'Add Equipment (Optional)',
    description: 'If you need rackets or other equipment, you can add them to your reservation. Equipment rental fees will be added to your total.',
    icon: CheckCircle,
    color: 'purple'
  },
  {
    number: 4,
    title: 'Review & Confirm',
    description: 'Review your booking details including date, time, court, and total amount. Make sure all information is correct before proceeding.',
    icon: CheckCircle,
    color: 'orange'
  },
  {
    number: 5,
    title: 'Complete Payment',
    description: 'Proceed to payment using your preferred method (GCash, Maya, GrabPay, or Online Banking). Your reservation will be confirmed once payment is successful.',
    icon: CreditCard,
    color: 'indigo'
  }
]

export function ReservationGuideModal({ isOpen, onClose }: ReservationGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('reservation-guide-disabled', 'true')
    }
    onClose()
  }

  const handleNext = () => {
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
          <h2 className="text-2xl font-bold mb-2">How to Make a Reservation</h2>
          <p className="text-white/90 text-sm">Follow these simple steps to book your badminton court</p>
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
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              currentStepData.color === 'blue' ? 'bg-blue-100' :
              currentStepData.color === 'green' ? 'bg-green-100' :
              currentStepData.color === 'purple' ? 'bg-purple-100' :
              currentStepData.color === 'orange' ? 'bg-orange-100' :
              'bg-indigo-100'
            }`}>
              <IconComponent className={`w-10 h-10 ${
                currentStepData.color === 'blue' ? 'text-blue-600' :
                currentStepData.color === 'green' ? 'text-green-600' :
                currentStepData.color === 'purple' ? 'text-purple-600' :
                currentStepData.color === 'orange' ? 'text-orange-600' :
                'text-indigo-600'
              }`} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.number}. {currentStepData.title}
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Visual Guide */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Selected</span>
              </div>
            </div>
          </div>
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
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Got it!</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

