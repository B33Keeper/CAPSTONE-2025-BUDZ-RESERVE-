import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowLeft, Home } from 'lucide-react'
import { api } from '../lib/api'

export function PaymentSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [bookingSummary, setBookingSummary] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Get payment details from URL parameters
    const paymentIntentId = searchParams.get('checkout_session_id')
    const amount = searchParams.get('amount')
    const reference = searchParams.get('reference')
    const paymentMethod = searchParams.get('payment_method')
    const bookingData = searchParams.get('bookingData')
    
    // Extract checkout session ID from URL parameters
    
    // Check if we have a checkout session ID in the URL parameters
    if (paymentIntentId && paymentIntentId !== '{CHECKOUT_SESSION_ID}') {
      // Process with the actual checkout session ID
      if (bookingData && !hasProcessed.current && !isProcessing) {
        try {
          const parsedBookingData = JSON.parse(decodeURIComponent(bookingData));
          const summary = {
            checkoutSessionId: paymentIntentId,
            amount: amount ? parseFloat(amount) : 0,
            date: parsedBookingData.selectedDate,
            courtBookings: parsedBookingData.courtBookings || [],
            equipmentBookings: parsedBookingData.equipmentBookings || [],
            referenceNumber: parsedBookingData.referenceNumber || `REF${Date.now()}`,
            paymentMethod: 'Processing...', // Will be updated after API call
            status: 'Processing payment details...'
          };
          
          setBookingSummary(summary);
          setPaymentDetails({
            paymentIntentId: paymentIntentId,
            amount: amount ? parseFloat(amount) : null,
            reference: summary.referenceNumber
          });
          
          // DISABLED: Frontend API calls to prevent duplication
          // Reservations will be created by Paymongo webhooks
          console.log('Frontend API calls disabled - using webhook-based processing');
          return; // Exit early
        } catch (error) {
          console.error('Error parsing booking data:', error);
        }
      }
    }
    
    // Try to get checkout session ID from document referrer (Paymongo redirect)
    if (document.referrer) {
      // Check if the referrer contains a checkout session ID
      const referrerMatch = document.referrer.match(/checkout\.paymongo\.com\/cs_([a-zA-Z0-9]+)/);
      if (referrerMatch) {
        // Use this checkout session ID instead of the placeholder
        const actualCheckoutSessionId = `cs_${referrerMatch[1]}`;
        
        // Parse booking data to create summary
        if (bookingData) {
          try {
            const parsedBookingData = JSON.parse(decodeURIComponent(bookingData));
            const summary = {
              checkoutSessionId: actualCheckoutSessionId,
              amount: amount ? parseFloat(amount) : 0,
              date: parsedBookingData.selectedDate,
              courtBookings: parsedBookingData.courtBookings || [],
              equipmentBookings: parsedBookingData.equipmentBookings || [],
              referenceNumber: parsedBookingData.referenceNumber || `REF${Date.now()}`,
              paymentMethod: 'Processing...', // Will be updated after API call
              status: 'Processing payment details...'
            };
            
            setBookingSummary(summary);
            setPaymentDetails({
              paymentIntentId: actualCheckoutSessionId,
              amount: amount ? parseFloat(amount) : null,
              reference: summary.referenceNumber
            });
            
            // DISABLED: Frontend API calls to prevent duplication
            // Reservations will be created by Paymongo webhooks
            return; // Exit early if we found the checkout session ID
          } catch (error) {
            console.error('Error parsing booking data:', error);
          }
        }
      }
    }

    // Fallback: If no referrer or checkout session ID found, try to process with placeholder
    // This will at least save the booking data even if we can't get the payment method
    if (bookingData && !hasProcessed.current && !isProcessing) {
      try {
        const parsedBookingData = JSON.parse(decodeURIComponent(bookingData));
        const summary = {
          checkoutSessionId: 'Processing...',
          amount: amount ? parseFloat(amount) : 0,
          date: parsedBookingData.selectedDate,
          courtBookings: parsedBookingData.courtBookings || [],
          equipmentBookings: parsedBookingData.equipmentBookings || [],
          referenceNumber: parsedBookingData.referenceNumber || `REF${Date.now()}`,
          paymentMethod: 'Processing...',
          status: 'Processing payment details...'
        };
        
        setBookingSummary(summary);
        setPaymentDetails({
          paymentIntentId: 'Processing...',
          amount: amount ? parseFloat(amount) : null,
          reference: summary.referenceNumber
        });
        
        // DISABLED: Frontend API calls to prevent duplication
        // Reservations will be created by Paymongo webhooks
        return; // Exit early
      } catch (error) {
        console.error('Error parsing booking data:', error);
      }
    }

    if (paymentIntentId && !hasProcessed.current && !isProcessing) {
      setPaymentDetails({
        paymentIntentId,
        amount: amount ? parseFloat(amount) : null,
        reference
      })

      // Create reservations and payment record immediately (only once)
      // DISABLED: Frontend API calls to prevent duplication
      // Reservations will be created by Paymongo webhooks
      console.log('Frontend API calls disabled - using webhook-based processing');
    }
  }, [searchParams])

  const createReservationsFromPayment = async (paymentId: string, bookingData: any, amount: number, paymentMethod: string) => {
    if (isProcessing) return; // Prevent duplicate calls
    
    // This function is kept for reference but not used in webhook-based processing
    setIsProcessing(true);
    try {
      const response = await api.post('/reservations/from-payment', {
        paymentId,
        bookingData,
        amount,
        paymentMethod
      })
      
      if (response.data) {
        
        // Update booking summary with payment method from response
        if (response.data.length > 0 && response.data[0].payments && response.data[0].payments.length > 0) {
          const paymentMethod = response.data[0].payments[0].payment_method;
          setBookingSummary((prev: any) => ({
            ...prev,
            paymentMethod: paymentMethod,
            status: 'Payment completed successfully!'
          }));
        }
      }
    } catch (error: any) {
      console.error('Error creating reservations:', error);
      alert('Payment successful but failed to create reservation. Please contact support.')
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your badminton court reservation has been confirmed. You will receive a confirmation email shortly.
        </p>

        {/* Booking Summary */}
        {bookingSummary && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Booking Summary</h3>
            
            {/* Date and Reference */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Reservation Date</p>
                <p className="text-sm text-gray-600">{bookingSummary.date}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Reference Number</p>
                <p className="text-sm text-gray-600">{bookingSummary.referenceNumber}</p>
              </div>
            </div>

            {/* Court Bookings */}
            {bookingSummary.courtBookings && bookingSummary.courtBookings.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Court Bookings</p>
                {bookingSummary.courtBookings.map((booking: any, index: number) => (
                  <div key={index} className="bg-white rounded p-3 mb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{booking.court}</span> - {booking.schedule}
                    </p>
                    <p className="text-sm text-gray-500">₱{booking.subtotal}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Equipment Bookings */}
            {bookingSummary.equipmentBookings && bookingSummary.equipmentBookings.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Equipment Bookings</p>
                {bookingSummary.equipmentBookings.map((booking: any, index: number) => (
                  <div key={index} className="bg-white rounded p-3 mb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{booking.equipment}</span> - {booking.time}
                    </p>
                    <p className="text-sm text-gray-500">₱{booking.subtotal}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Amount</p>
                <p className="text-lg font-semibold text-gray-900">₱{bookingSummary.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Payment Method</p>
                <p className="text-sm text-gray-600">{bookingSummary.paymentMethod}</p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">{bookingSummary.status}</p>
            </div>
          </div>
        )}

        {/* Payment Details (fallback) */}
        {!bookingSummary && paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
            {paymentDetails.amount && (
              <p className="text-sm text-gray-600">
                Amount: ₱{paymentDetails.amount.toLocaleString()}
              </p>
            )}
            {paymentDetails.reference && (
              <p className="text-sm text-gray-600">
                Reference: {paymentDetails.reference}
              </p>
            )}
            {paymentDetails.paymentIntentId && (
              <p className="text-sm text-gray-600">
                Payment ID: {paymentDetails.paymentIntentId}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Go to Home</span>
          </button>
          
          <button
            onClick={() => navigate('/bookings')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>View Bookings</span>
          </button>
          
          {/* Test Webhook Button - Remove in production */}
          {import.meta.env.DEV && (
            <button
              onClick={async () => {
                try {
                  const testData = {
                    checkoutSessionId: 'cs_test123',
                    paymentId: 'pay_test123',
                    paymentMethod: 'paymaya', // Test with PayMaya
                    amount: bookingSummary?.totalAmount || 220,
                    bookingData: bookingSummary ? {
                      userId: 1,
                      selectedDate: bookingSummary.date,
                      courtBookings: bookingSummary.courtBookings,
                      equipmentBookings: bookingSummary.equipmentBookings,
                      referenceNumber: bookingSummary.referenceNumber
                    } : null,
                    customerName: 'Test Customer',
                    customerEmail: 'test@example.com',
                    customerPhone: '+639123456789',
                    customerAddress: 'Test Address'
                  };
                  
                  const response = await fetch('http://localhost:3001/api/webhook/test-webhook', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(testData)
                  });
                  
                  const result = await response.json();
                  alert('Webhook test completed! Check database for new reservation.');
                } catch (error) {
                  console.error('Webhook test error:', error);
                  alert('Webhook test failed. Check console.');
                }
              }}
              className="w-full bg-yellow-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              🧪 Test Webhook (Dev Only)
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> Please arrive 15 minutes before your scheduled time. 
            Bring a valid ID for verification.
          </p>
        </div>
      </div>
    </div>
  )
}
