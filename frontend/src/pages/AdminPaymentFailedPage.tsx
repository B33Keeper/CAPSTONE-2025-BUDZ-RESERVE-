import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { XCircle, ArrowLeft, RefreshCw, LayoutDashboard } from 'lucide-react'

export function AdminPaymentFailedPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorDetails, setErrorDetails] = useState<any>(null)

  useEffect(() => {
    // Get error details from URL parameters
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const paymentIntentId = searchParams.get('payment_intent_id')
    const checkoutSessionId = searchParams.get('checkout_session_id')

    if (error) {
      setErrorDetails({
        error,
        errorDescription,
        paymentIntentId,
        checkoutSessionId
      })
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          The customer's payment could not be processed. Please try again or select a different payment method.
        </p>

        {/* Error Details */}
        {errorDetails && (
          <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
            <p className="text-sm text-red-700">
              {errorDetails.errorDescription || errorDetails.error || 'Unknown error occurred'}
            </p>
            {errorDetails.checkoutSessionId && (
              <p className="text-sm text-red-600 mt-2">
                Checkout Session ID: {errorDetails.checkoutSessionId}
              </p>
            )}
            {errorDetails.paymentIntentId && (
              <p className="text-sm text-red-600 mt-2">
                Payment ID: {errorDetails.paymentIntentId}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/admin/create-reservations')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => navigate('/admin')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You can process cash payment directly from the create reservations page, or try the online payment again.
          </p>
        </div>
      </div>
    </div>
  )
}

