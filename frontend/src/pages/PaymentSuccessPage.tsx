import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowLeft, Home, Calendar } from 'lucide-react'
import { api } from '../lib/api'
import { ReservationsModal } from '../components/modals/ReservationsModal'

export function PaymentSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [bookingSummary, setBookingSummary] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const hasProcessed = useRef(false)

  const steps = [
    { id: 1, name: 'Select a date', hint: 'Pick your play day' },
    { id: 2, name: 'Select time & court no.', hint: 'Choose slot and court' },
    { id: 3, name: 'Select payment method.', hint: 'Confirm your payment' },
    { id: 4, name: 'Completed', hint: 'Booking finalized' }
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
      console.log('[PaymentSuccessPage] Fetching payment method for reference:', referenceNumber, 'checkoutSessionId:', checkoutSessionId)
      
      // Fetch user's reservations to find the one with matching reference number
      const response = await api.get('/reservations/my-reservations')
      const reservations = response.data || []
      
      console.log('[PaymentSuccessPage] Total reservations found:', reservations.length)
      
      // Find ALL reservations with matching reference number or checkout session ID
      // In a transaction with multiple courts, all reservations share the same reference number
      const matchingReservations = reservations.filter((res: any) => 
        res.Reference_Number === referenceNumber || 
        res.Paymongo_Reference_Number === referenceNumber ||
        (checkoutSessionId && res.Paymongo_Reference_Number === checkoutSessionId)
      )
      
      console.log('[PaymentSuccessPage] Found', matchingReservations.length, 'reservations matching reference')
      
      // Check all matching reservations for payment method
      // Since all reservations in a transaction share the same payment, we can check any of them
      for (const reservation of matchingReservations) {
        if (reservation.payments && reservation.payments.length > 0) {
          const paymentMethod = reservation.payments[0].payment_method
          console.log('[PaymentSuccessPage] Found payment method from reservation', reservation.Reservation_ID, ':', paymentMethod)
          
          // Update booking summary with actual payment method
          setBookingSummary((prev: any) => ({
            ...prev,
            paymentMethod: paymentMethod || 'Processing...',
            status: paymentMethod ? 'Payment completed successfully!' : 'Processing payment details...'
          }))
          
          return paymentMethod
        }
      }
      
      // If not found by reference, try to find the most recent reservation (webhook might have just created it)
      if (matchingReservations.length === 0 && reservations.length > 0) {
        console.log('[PaymentSuccessPage] Reference not found, checking most recent reservations')
        // Sort by created_at descending and check the most recent ones
        const sortedReservations = [...reservations].sort((a: any, b: any) => {
          const dateA = new Date(a.Created_at || 0).getTime()
          const dateB = new Date(b.Created_at || 0).getTime()
          return dateB - dateA
        })
        
        // Check the most recent reservations (could be multiple in same transaction)
        for (const reservation of sortedReservations.slice(0, 5)) { // Check up to 5 most recent
          if (reservation.payments && reservation.payments.length > 0) {
            const paymentMethod = reservation.payments[0].payment_method
            console.log('[PaymentSuccessPage] Found payment method from most recent reservation:', paymentMethod)
            
            setBookingSummary((prev: any) => ({
              ...prev,
              paymentMethod: paymentMethod || 'Processing...',
              status: paymentMethod ? 'Payment completed successfully!' : 'Processing payment details...'
            }))
            
            return paymentMethod
          }
        }
        
        console.log('[PaymentSuccessPage] No payment method found in most recent reservations')
      } else if (matchingReservations.length > 0) {
        console.log('[PaymentSuccessPage] Found', matchingReservations.length, 'matching reservations but none have payments yet (webhook may still be processing)')
      } else {
        console.log('[PaymentSuccessPage] No reservation found matching reference:', referenceNumber)
      }
      
      return null
    } catch (error) {
      console.error('[PaymentSuccessPage] Error fetching payment method:', error)
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
    
    // Extract checkout session ID from URL parameters
    
    // Check if we have a checkout session ID in the URL parameters
    if (paymentIntentId && paymentIntentId !== '{CHECKOUT_SESSION_ID}') {
      // Process with the actual checkout session ID
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
            paymentMethod: paymentMethod || 'Processing...', // Use URL param if available, otherwise will be updated
            status: 'Processing payment details...'
          };
          
          setBookingSummary(summary);
          setPaymentDetails({
            paymentIntentId: paymentIntentId,
            amount: amount ? parseFloat(amount) : null,
            reference: referenceNumber
          });
          
          // Try to fetch payment method from backend (webhook should have processed it)
          if (!paymentMethod) {
            // Try immediately first
            fetchPaymentMethod(referenceNumber, paymentIntentId).then((method) => {
              if (!method) {
                // If not found immediately, poll for payment method (webhook may take a moment)
                const pollInterval = setInterval(async () => {
                  const fetchedMethod = await fetchPaymentMethod(referenceNumber, paymentIntentId)
                  if (fetchedMethod) {
                    clearInterval(pollInterval)
                  }
                }, 2000) // Poll every 2 seconds
                
                // Stop polling after 30 seconds
                setTimeout(() => clearInterval(pollInterval), 30000)
              }
            })
          }
          
          hasProcessed.current = true
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
            const referenceNumber = parsedBookingData.referenceNumber || `REF${Date.now()}`
            const summary = {
              checkoutSessionId: actualCheckoutSessionId,
              amount: amount ? parseFloat(amount) : 0,
              date: parsedBookingData.selectedDate,
              courtBookings: parsedBookingData.courtBookings || [],
              equipmentBookings: parsedBookingData.equipmentBookings || [],
              referenceNumber: referenceNumber,
              paymentMethod: paymentMethod || 'Processing...',
              status: 'Processing payment details...'
            };
            
            setBookingSummary(summary);
            setPaymentDetails({
              paymentIntentId: actualCheckoutSessionId,
              amount: amount ? parseFloat(amount) : null,
              reference: referenceNumber
            });
            
            // Try to fetch payment method from backend (webhook should have processed it)
            if (!paymentMethod) {
              // Try immediately first
              fetchPaymentMethod(referenceNumber, actualCheckoutSessionId).then((method) => {
                if (!method) {
                  // If not found immediately, poll for payment method (webhook may take a moment)
                  const pollInterval = setInterval(async () => {
                    const fetchedMethod = await fetchPaymentMethod(referenceNumber, actualCheckoutSessionId)
                    if (fetchedMethod) {
                      clearInterval(pollInterval)
                    }
                  }, 2000) // Poll every 2 seconds
                  
                  // Stop polling after 30 seconds
                  setTimeout(() => clearInterval(pollInterval), 30000)
                }
              })
            }
            
            hasProcessed.current = true
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
        const referenceNumber = parsedBookingData.referenceNumber || `REF${Date.now()}`
        const summary = {
          checkoutSessionId: 'Processing...',
          amount: amount ? parseFloat(amount) : 0,
          date: parsedBookingData.selectedDate,
          courtBookings: parsedBookingData.courtBookings || [],
          equipmentBookings: parsedBookingData.equipmentBookings || [],
          referenceNumber: referenceNumber,
          paymentMethod: paymentMethod || 'Processing...',
          status: 'Processing payment details...'
        };
        
        setBookingSummary(summary);
        setPaymentDetails({
          paymentIntentId: 'Processing...',
          amount: amount ? parseFloat(amount) : null,
          reference: referenceNumber
        });
        
        // Try to fetch payment method from backend (webhook should have processed it)
        if (!paymentMethod) {
          // Try immediately first
          fetchPaymentMethod(referenceNumber).then((method) => {
            if (!method) {
              // If not found immediately, poll for payment method (webhook may take a moment)
              const pollInterval = setInterval(async () => {
                const fetchedMethod = await fetchPaymentMethod(referenceNumber)
                if (fetchedMethod) {
                  clearInterval(pollInterval)
                }
              }, 2000) // Poll every 2 seconds
              
              // Stop polling after 30 seconds
              setTimeout(() => clearInterval(pollInterval), 30000)
            }
          })
        }
        
        hasProcessed.current = true
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center gap-6 p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="w-full max-w-5xl relative z-10">
        <div className="bg-gradient-to-r from-white via-slate-50 to-white border border-slate-200/60 rounded-3xl px-6 py-5 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur-sm">
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

      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-300/50 p-6 sm:p-8 lg:p-10 max-w-6xl w-full relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500"></div>
        
        {/* Horizontal Layout: Success Message (Left) + Booking Summary (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-4">
          {/* Left Column: Success Message */}
          <div className="flex flex-col items-center lg:items-start justify-center text-center lg:text-left">
            {/* Success Icon with animation */}
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white" strokeWidth={2.5} />
                </div>
          </div>
        </div>

        {/* Success Message */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Payment Successful!
        </h1>
        
            <p className="text-gray-600 text-base sm:text-lg mb-6 lg:mb-8 max-w-md lg:max-w-none">
          Your badminton court reservation has been confirmed. You will receive a confirmation email shortly.
        </p>

            {/* Action Buttons - Shown on left side for desktop */}
            <div className="w-full lg:max-w-sm space-y-3 hidden lg:flex lg:flex-col lg:items-center lg:mx-auto">
              <button
                onClick={() => navigate('/booking')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] transform"
              >
                <Calendar className="w-5 h-5" />
                <span>Book Again</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => {
                    window.location.href = '/#hero'
                  }}
                  className="bg-white border-2 border-blue-600 text-blue-600 py-3 px-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg hover:scale-[1.02] transform"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowReservationModal(true)
                  }}
                  className="bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg hover:scale-[1.02] transform"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Bookings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Summary */}
        {bookingSummary && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 sm:p-8 text-left border border-slate-200/60 shadow-inner">
            <h3 className="font-bold text-xl text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Booking Summary
            </h3>
            
            {/* Date and Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reservation Date</p>
                <p className="text-base font-semibold text-gray-900">{bookingSummary.date}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reference Number</p>
                <p className="text-base font-semibold text-gray-900 font-mono">{bookingSummary.referenceNumber}</p>
              </div>
            </div>

            {/* Court Bookings */}
            {bookingSummary.courtBookings && bookingSummary.courtBookings.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Court Bookings
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bookingSummary.courtBookings.map((booking: any, index: number) => (
                    <div key={index} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{booking.court}</p>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">{booking.schedule}</p>
                        </div>
                        <p className="text-sm font-bold text-blue-600 whitespace-nowrap">₱{booking.subtotal.toLocaleString()}</p>
                      </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Equipment Bookings */}
            {bookingSummary.equipmentBookings && bookingSummary.equipmentBookings.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Equipment Bookings
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bookingSummary.equipmentBookings.map((booking: any, index: number) => {
                  const quantity = booking.quantity || 1;
                  return (
                    <div key={index} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {booking.equipment}
                            {quantity > 1 && <span className="text-xs text-gray-500 ml-1">(Qty: {quantity})</span>}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">{booking.time}</p>
                        </div>
                        <p className="text-sm font-bold text-indigo-600 whitespace-nowrap">₱{booking.subtotal.toLocaleString()}</p>
                      </div>
                  </div>
                  );
                })}
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t-2 border-slate-200">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Amount</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">₱{bookingSummary.amount.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Payment Method</p>
                <p className="text-base font-semibold text-gray-900">{bookingSummary.paymentMethod}</p>
              </div>
            </div>

            {/* Status */}
            {bookingSummary.status && (
            <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium">{bookingSummary.status}</p>
                </div>
            </div>
            )}
          </div>
        )}

        {/* Payment Details (fallback) */}
        {!bookingSummary && paymentDetails && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 sm:p-8 text-left border border-slate-200/60 shadow-inner">
              <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Payment Details
              </h3>
            {paymentDetails.amount && (
                <p className="text-sm text-gray-600 mb-2">
                Amount: ₱{paymentDetails.amount.toLocaleString()}
              </p>
            )}
            {paymentDetails.reference && (
                <p className="text-sm text-gray-600 mb-2">
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
        </div>

        {/* Action Buttons - Shown at bottom for mobile/tablet */}
        <div className="w-full max-w-md mx-auto space-y-3 mt-6 lg:hidden">
          <button
            onClick={() => navigate('/booking')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] transform"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Again</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => {
              window.location.href = '/#hero'
            }}
              className="bg-white border-2 border-blue-600 text-blue-600 py-3 px-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg hover:scale-[1.02] transform"
          >
            <Home className="w-5 h-5" />
              <span>Home</span>
          </button>
          
          <button
            onClick={() => {
              setShowReservationModal(true)
            }}
              className="bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg hover:scale-[1.02] transform"
          >
            <ArrowLeft className="w-5 h-5" />
              <span>Bookings</span>
          </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200/60 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Important Reminders</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Please arrive 15 minutes before your scheduled time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Bring a valid ID for verification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>

      <ReservationsModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
      />
    </>
  )
}
