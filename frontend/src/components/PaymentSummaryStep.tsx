import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { formatPHPhoneNumber } from '../lib/validation';
import { PaymentService } from '../lib/paymentService';

interface BookingItem {
  courtName: string;
  timeSlot: string;
  subtotal: number;
}

interface PaymentSummaryStepProps {
  courtBookings: BookingItem[];
  equipmentBookings: BookingItem[];
  totalAmount: number;
  selectedDate: string;
  referenceNumber: string;
  onBack: () => void;
  onProceedToPayment: (userInfo: { name: string; email: string; contactNumber: string }) => void;
}

export function PaymentSummaryStep({
  courtBookings,
  equipmentBookings,
  totalAmount,
  selectedDate,
  referenceNumber,
  onBack,
  onProceedToPayment
}: PaymentSummaryStepProps) {
  const { user } = useAuthStore();
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    contactNumber: ''
  });

  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.name || '',
        email: user.email || '',
        contactNumber: user.contact_number || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    // Format phone number if it's the contactNumber field
    const formattedValue = field === 'contactNumber' ? formatPHPhoneNumber(value) : value;
    setUserInfo(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const allBookings = [...courtBookings, ...equipmentBookings];

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-300/50 p-6 sm:p-8 lg:p-10 relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 mt-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Complete Your Reservation
            </h1>
          </div>
          <div className="mt-4 sm:mt-0 text-left sm:text-right bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Selected Date</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedDate}</p>
          </div>
        </div>

        {/* All Content in Single Container */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200/60 shadow-inner">
          {/* User Information Section */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your Complete Name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={userInfo.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your Email Address"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
                  required
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200"></div>

          {/* Reference Number */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Reference Number</p>
                <p className="text-base font-bold text-gray-900 font-mono">{referenceNumber}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200"></div>

          {/* Booking Summary */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Booking Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allBookings.map((booking, index) => {
                    console.log(`[PaymentSummaryStep] Displaying booking ${index + 1}:`, {
                      courtName: booking.courtName,
                      timeSlot: booking.timeSlot,
                      subtotal: booking.subtotal
                    })
                    return (
                      <tr key={`${booking.courtName}-${booking.timeSlot}-${index}`} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {booking.courtName}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {booking.timeSlot}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                          ₱{booking.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200"></div>

          {/* Payment Details */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Payment Details
            </h2>
            <div className="bg-white rounded-xl p-6 border-2 border-emerald-200 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-lg sm:text-xl font-semibold text-gray-700">Total:</span>
                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  ₱{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200"></div>

          {/* Payment Methods */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payment Methods
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col items-center p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 transform">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center mb-3 shadow-md overflow-hidden bg-white">
                  <img 
                    src="/assets/PAYMENT METHOD IMAGE/GCASH.png" 
                    alt="GCash" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">GCash</span>
              </div>
              <div className="flex flex-col items-center p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 transform">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center mb-3 shadow-md overflow-hidden bg-white">
                  <img 
                    src="/assets/PAYMENT METHOD IMAGE/maya.jpg" 
                    alt="Maya" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">Maya</span>
              </div>
              <div className="flex flex-col items-center p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 transform">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center mb-3 shadow-md overflow-hidden bg-white">
                  <img 
                    src="/assets/PAYMENT METHOD IMAGE/Grabpay.png" 
                    alt="GrabPay" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">GrabPay</span>
              </div>
              <div className="flex flex-col items-center p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 transform">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center mb-3 shadow-md overflow-hidden bg-white">
                  <img 
                    src="/assets/PAYMENT METHOD IMAGE/Visa CARD.png" 
                    alt="Online Banking" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">Online Banking</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-indigo-200 text-center shadow-sm">
              <p className="text-sm text-gray-600">
                Send Your payment to <strong className="text-indigo-600">Budz Badminton Court</strong>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200"></div>

          {/* Payment Confirmation & No Refund Policy */}
          <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-xl p-5 border-2 border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-yellow-900 mb-2">
                  Payment Confirmation & No Refund Policy
                </h3>
                <p className="text-sm text-yellow-800 leading-relaxed">
                  By proceeding with payment, you confirm that the transaction is final and non-refundable. 
                  Cancellations are not accepted. If you agree, please continue with the payment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Test Result */}
        {webhookTestResult && (
          <div className={`mt-4 p-4 rounded-xl border-2 ${
            webhookTestResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {webhookTestResult.success ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className={`text-sm font-semibold ${
                webhookTestResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {webhookTestResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] transform"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={() => onProceedToPayment(userInfo)}
            disabled={!userInfo.name || !userInfo.email || !userInfo.contactNumber}
            className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] transform disabled:hover:scale-100"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
}
