import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowLeft, LayoutDashboard } from 'lucide-react'
import { api } from '../lib/api'

export function AdminPaymentSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [bookingSummary, setBookingSummary] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const hasProcessed = useRef(false)

  const steps = [
    { id: 1, name: 'Customer Info', hint: 'Enter customer details' },
    { id: 2, name: 'Select date', hint: 'Pick the play day' },
    { id: 3, name: 'Select time & court', hint: 'Choose slot and court' },
    { id: 4, name: 'Payment method', hint: 'Confirm payment' },
    { id: 5, name: 'Completed', hint: 'Reservation finalized' }
  ]
  const currentStep = steps.length + 1

  const getStepState = (stepId: number): 'completed' | 'current' | 'upcoming' => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  // Function to fetch payment method from backend
  const fetchPaymentMethod = async (referenceNumber: string, checkoutSessionId?: string) => {
    try {
      console.log('[AdminPaymentSuccessPage] Fetching payment method for reference:', referenceNumber, 'checkoutSessionId:', checkoutSessionId)
      
      // Fetch all reservations (admin can see all)
      const response = await api.get('/reservations/all')
      const reservations = response.data || []
      
      console.log('[AdminPaymentSuccessPage] Total reservations found:', reservations.length)
      
      // Find reservations with matching reference number or checkout session ID
      const matchingReservations = reservations.filter((res: any) => 
        res.Reference_Number === referenceNumber || 
        res.Paymongo_Reference_Number === referenceNumber ||
        (checkoutSessionId && res.Paymongo_Reference_Number === checkoutSessionId)
      )
      
      console.log('[AdminPaymentSuccessPage] Found', matchingReservations.length, 'reservations matching reference')
      
      // Check all matching reservations for payment method
      for (const reservation of matchingReservations) {
        if (reservation.payments && reservation.payments.length > 0) {
          const paymentMethod = reservation.payments[0].payment_method
          console.log('[AdminPaymentSuccessPage] Found payment method from reservation', reservation.Reservation_ID, ':', paymentMethod)
          
          setBookingSummary((prev: any) => ({
            ...prev,
            paymentMethod: paymentMethod || 'Processing...',
            status: paymentMethod ? 'Payment completed successfully!' : 'Processing payment details...'
          }))
          
          return paymentMethod
        }
      }
      
      // If not found by reference, try to find the most recent reservation
      if (matchingReservations.length === 0 && reservations.length > 0) {
        console.log('[AdminPaymentSuccessPage] Reference not found, checking most recent reservations')
        const sortedReservations = [...reservations].sort((a: any, b: any) => {
          const dateA = new Date(a.Created_at || 0).getTime()
          const dateB = new Date(b.Created_at || 0).getTime()
          return dateB - dateA
        })
        
        for (const reservation of sortedReservations.slice(0, 5)) {
          if (reservation.payments && reservation.payments.length > 0) {
            const paymentMethod = reservation.payments[0].payment_method
            console.log('[AdminPaymentSuccessPage] Found payment method from most recent reservation:', paymentMethod)
            
            setBookingSummary((prev: any) => ({
              ...prev,
              paymentMethod: paymentMethod || 'Processing...',
              status: paymentMethod ? 'Payment completed successfully!' : 'Processing payment details...'
            }))
            
            return paymentMethod
          }
        }
        
        console.log('[AdminPaymentSuccessPage] No payment method found in most recent reservations')
      } else if (matchingReservations.length > 0) {
        console.log('[AdminPaymentSuccessPage] Found', matchingReservations.length, 'matching reservations but none have payments yet (webhook may still be processing)')
      } else {
        console.log('[AdminPaymentSuccessPage] No reservation found matching reference:', referenceNumber)
      }
      
      return null
    } catch (error) {
      console.error('[AdminPaymentSuccessPage] Error fetching payment method:', error)
      return null
    }
  }

  useEffect(() => {
    // Get payment details from URL parameters
    const paymentIntentId = searchParams.get('checkout_session_id')
    const amount = searchParams.get('amount')
    const reference = searchParams.get('reference')
    const paymentMethod = searchParams.get('payment_method')
    const bookingData = searchParams.get('bookingData')
    
    // Check if we have a checkout session ID in the URL parameters
    if (paymentIntentId && paymentIntentId !== '{CHECKOUT_SESSION_ID}') {
      if (bookingData && !hasProcessed.current && !isProcessing) {
        try {
          const parsedBookingData = JSON.parse(decodeURIComponent(bookingData));
          const referenceNumber = parsedBookingData.referenceNumber || `REF${Date.now()}`
          const summary = {
            checkoutSessionId: paymentIntentId,
            amount: amount ? parseFloat(amount) : 0,
            date: parsedBookingData.selectedDate,
            courtBookings: parsedBookingData.courtBookings || [],
            equipmentBookings: parsedBookingData.equipmentBookings || [],
            referenceNumber: referenceNumber,
            customerName: parsedBookingData.customerName,
            paymentMethod: paymentMethod || 'Processing...',
            status: 'Processing payment details...'
          };
          
          setBookingSummary(summary);
          setPaymentDetails({
            paymentIntentId: paymentIntentId,
            amount: amount ? parseFloat(amount) : null,
            reference: referenceNumber
          });
          
          // Try to fetch payment method from backend
          if (!paymentMethod) {
            fetchPaymentMethod(referenceNumber, paymentIntentId).then((method) => {
              if (!method) {
                const pollInterval = setInterval(async () => {
                  const fetchedMethod = await fetchPaymentMethod(referenceNumber, paymentIntentId)
                  if (fetchedMethod) {
                    clearInterval(pollInterval)
                  }
                }, 2000)
                
                setTimeout(() => clearInterval(pollInterval), 30000)
              }
            })
          }
          
          hasProcessed.current = true
        } catch (error) {
          console.error('Error parsing booking data:', error);
        }
      }
    }
  }, [searchParams])

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-full max-w-5xl">
          <div className="bg-gradient-to-r from-slate-100 via-white to-slate-100 border border-slate-200 rounded-2xl px-6 py-5 shadow-sm overflow-hidden">
            <ol className="mx-auto flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {steps.map((step, index) => {
                const state = getStepState(step.id)
                const isLast = index === steps.length - 1
                const isCompleted = state === 'completed'
                const isCurrent = state === 'current'

                const stateStyles: Record<typeof state, {
                  circle: string
                  title: string
                  hint: string
                  icon?: JSX.Element
                }> = {
                  completed: {
                    circle: 'bg-emerald-500 text-white shadow-md shadow-emerald-200',
                    title: 'text-emerald-600',
                    hint: 'text-emerald-500',
                    icon: (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )
                  },
                  current: {
                    circle: 'bg-blue-600 text-white shadow-lg shadow-blue-200',
                    title: 'text-blue-700',
                    hint: 'text-blue-500'
                  },
                  upcoming: {
                    circle: 'bg-white text-slate-400 border border-slate-200',
                    title: 'text-slate-500',
                    hint: 'text-slate-400'
                  }
                }

                const styles = stateStyles[state]

                return (
                  <li key={step.id} className="flex flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center sm:min-w-0">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 sm:h-10 sm:w-10 flex-shrink-0 ${styles.circle}`}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {styles.icon ?? step.id}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold tracking-tight sm:text-base ${styles.title}`}>{step.name}</p>
                        <p className={`text-xs font-medium sm:text-sm ${styles.hint}`}>{step.hint}</p>
                      </div>
                    </div>

                    {!isLast && (
                      <div className="ml-12 hidden flex-1 sm:flex min-w-0">
                        <div
                          className={`h-1 w-full rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-300' : isCurrent ? 'bg-blue-400' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                    )}

                    {!isLast && (
                      <div
                        className={`ml-4 h-8 w-px self-stretch sm:hidden ${
                          isCompleted ? 'bg-emerald-200' : isCurrent ? 'bg-blue-200' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

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
            The customer's reservation has been confirmed successfully. A confirmation email will be sent to the customer.
          </p>

          {/* Booking Summary */}
          {bookingSummary && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">Reservation Summary</h3>
              
              {/* Customer Info */}
              {bookingSummary.customerName && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Customer Name</p>
                  <p className="text-sm text-gray-600">{bookingSummary.customerName}</p>
                </div>
              )}
              
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
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/create-reservations')}
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Create Another Reservation</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The reservation has been successfully created and the customer will receive a confirmation email.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

