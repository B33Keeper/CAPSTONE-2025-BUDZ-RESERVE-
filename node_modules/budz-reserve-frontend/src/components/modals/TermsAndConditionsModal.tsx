import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Shield, CreditCard, Clock, RefreshCw } from 'lucide-react'

interface TermsAndConditionsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  initialAccepted?: boolean
  onAcceptedChange?: (accepted: boolean) => void
}

export function TermsAndConditionsModal({ isOpen, onClose, onAccept, initialAccepted = false, onAcceptedChange }: TermsAndConditionsModalProps) {
  const [accepted, setAccepted] = useState(initialAccepted)

  // Sync the accepted state when initialAccepted prop changes
  useEffect(() => {
    setAccepted(initialAccepted)
  }, [initialAccepted])

  // Reset accepted state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAccepted(initialAccepted)
    }
  }, [isOpen, initialAccepted])

  // Notify parent when checkbox state changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAccepted = e.target.checked
    setAccepted(newAccepted)
    if (onAcceptedChange) {
      onAcceptedChange(newAccepted)
    }
  }

  if (!isOpen) return null

  const handleAccept = () => {
    if (accepted) {
      onAccept()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto relative">
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-center relative">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Terms and Conditions</h2>
            </div>
            <button
              onClick={onClose}
              className="absolute right-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 pb-8">
          {/* Introduction */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Important Notice</h3>
                <p className="text-blue-700 leading-relaxed">
                  By clicking "Proceed" and making a reservation, you acknowledge that you have read, understood, and agree to be bound by the following terms and conditions. Please review them carefully before proceeding with your booking.
                </p>
              </div>
            </div>
          </div>

          {/* Terms Content */}
          <div className="space-y-6 mb-8">
            {/* Payment Methods */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-blue-800 mb-3">1. Accepted Payment Methods</h3>
                  <p className="text-gray-700 mb-3">We accept the following payment methods for court reservations:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>GCash (Preferred method)</li>
                    <li>PayMaya</li>
                    <li>Bank Transfer</li>
                    <li>Credit/Debit Cards</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Timing */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-800 mb-3">2. Payment Timing</h3>
                  <p className="text-gray-700">Full payment is required at the time of booking to confirm your reservation. No partial payments are accepted.</p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-purple-800 mb-3">3. Security of Payment</h3>
                  <p className="text-gray-700">Payments are processed through secure, encrypted payment gateways to protect your personal and financial information. We do not store your payment details.</p>
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-orange-800 mb-3">4. Payment Confirmation</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>A confirmation email will be sent upon successful payment and reservation</li>
                    <li>If you do not receive a confirmation within 10 minutes, please contact our support team</li>
                    <li>Keep your reference number for future inquiries</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Failed Payments */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-800 mb-3">5. Failed or Declined Payments</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>If a payment fails or is declined, the reservation will not be processed</li>
                    <li>Users are responsible for ensuring sufficient funds and correct payment details</li>
                    <li>Contact your bank if payment issues persist</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Refunds */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-indigo-800 mb-3">6. Refunds and Cancellation Policy</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-semibold mb-2">⚠️ Important: No Cancellation Policy</p>
                    <p className="text-gray-700">Once you have reserved a court, there is <strong>no cancellation or refund</strong> allowed. Please ensure you can attend your scheduled time before making a reservation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Rental Policy */}
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-teal-800 mb-3">7. Equipment Rental Usage</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Rackets and any rented equipment are for use <strong>within the premises of Budz Badminton Court only</strong>.</li>
                    <li>Removing rented equipment from the venue is strictly prohibited.</li>
                    <li>Rented items must be returned in good condition at the end of your booked time.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Agreement Required</h3>
              </div>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                By clicking "Proceed", you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions outlined above.
              </p>
              
              {/* Checkbox */}
              <div className="flex items-center justify-center">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={handleCheckboxChange}
                      className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200 group-hover:border-blue-400"
                    />
                    {accepted && (
                      <CheckCircle className="w-5 h-5 text-blue-600 absolute top-0 left-0 pointer-events-none" />
                    )}
                  </div>
                  <span className="ml-3 text-gray-800 font-medium">
                    I accept the terms and conditions
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className={`px-8 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg transform ${
                accepted
                  ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {accepted ? 'Proceed to Booking' : 'Please Accept Terms First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
