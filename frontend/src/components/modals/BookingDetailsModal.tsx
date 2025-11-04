import { useState } from 'react'
import { X, Calendar, Clock, MapPin, CreditCard, AlertCircle } from 'lucide-react'
import { TermsAndConditionsModal } from './TermsAndConditionsModal'

interface CourtBooking {
  court: string
  schedule: string
  subtotal: number
}

interface EquipmentBooking {
  equipment: string
  time: string
  subtotal: number
}

interface BookingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  onProceedToPayment: () => void
  courtBookings: CourtBooking[]
  equipmentBookings: EquipmentBooking[]
  totalAmount: number
  selectedDate: string
}

export function BookingDetailsModal({
  isOpen,
  onClose,
  onProceedToPayment,
  courtBookings,
  equipmentBookings,
  totalAmount,
  selectedDate
}: BookingDetailsModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  if (!isOpen) return null

  const handleProceedToPayment = () => {
    if (acceptedTerms) {
      // Close modal and let parent component handle moving to Step 3
      onClose()
      onProceedToPayment()
    }
  }

  const handleTermsLinkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowTermsModal(true)
  }

  const handleTermsModalClose = () => {
    setShowTermsModal(false)
  }

  const handleTermsModalAccept = () => {
    // Auto-check the terms checkbox when user accepts in modal
    setAcceptedTerms(true)
    setShowTermsModal(false)
  }

  // Handle checkbox change in BookingDetailsModal
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAcceptedTerms(e.target.checked)
  }

  // Handle checkbox change in Terms modal - sync with BookingDetailsModal checkbox
  const handleTermsModalCheckboxChange = (accepted: boolean) => {
    setAcceptedTerms(accepted)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-600 text-white p-6 relative">
          <div className="text-center">
              <h2 className="text-2xl font-bold">Booking Details</h2>
            <p className="text-gray-200 mt-1">Review your reservation before proceeding to payment</p>
            </div>
            <button
              onClick={onClose}
            className="absolute top-6 right-6 text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
              aria-label="Close booking details"
            >
              <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Booking Date */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">Booking Date</h3>
                <p className="text-gray-600">{selectedDate || 'No date selected'}</p>
              </div>
            </div>
          </div>

          {/* Court Bookings */}
          {courtBookings.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Court Reservations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Court</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Schedule</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courtBookings.map((booking, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">{booking.court}</td>
                        <td className="border border-gray-300 px-4 py-3">{booking.schedule}</td>
                        <td className="border border-gray-300 px-4 py-3 font-medium">₱{booking.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Equipment Bookings */}
          {equipmentBookings.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Equipment Rentals</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Equipment</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Time</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentBookings.map((booking, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">{booking.equipment}</td>
                        <td className="border border-gray-300 px-4 py-3">{booking.time}</td>
                        <td className="border border-gray-300 px-4 py-3 font-medium">₱{booking.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">₱{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Important Payment & Cancellation Policy</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                  <li>Payment is required to confirm your reservation</li>
                  <li>Strictly "No Cancellation and Refund Policy" - once reserved, there is no cancellation</li>
                  <li>Please ensure all details are correct before proceeding</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="mb-6 flex justify-center">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={handleCheckboxChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 text-center">
                I have read and agree to the{' '}
                <button 
                  onClick={handleTermsLinkClick}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Terms and Conditions
                </button>
                {' '}and understand the no cancellation policy.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleProceedToPayment}
            disabled={!acceptedTerms}
            className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              acceptedTerms
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>{acceptedTerms ? 'Proceed to Payment' : 'Accept Terms to Continue'}</span>
          </button>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={handleTermsModalClose}
        onAccept={handleTermsModalAccept}
        initialAccepted={acceptedTerms}
        onAcceptedChange={handleTermsModalCheckboxChange}
      />
    </div>
  )
}
