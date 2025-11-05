import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

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
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const allBookings = [...courtBookings, ...equipmentBookings];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Reservation</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Selected Date:</p>
          <p className="text-lg font-semibold text-gray-900">{selectedDate}</p>
        </div>
      </div>

      {/* User Information Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name:
            </label>
            <input
              type="text"
              value={userInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your Complete Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number:
            </label>
            <input
              type="tel"
              value={userInfo.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              placeholder="Enter your Contact Number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address:
            </label>
            <input
              type="email"
              value={userInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your Email Address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Reference Number */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-800">
              Reference Number: <span className="font-mono">{referenceNumber}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allBookings.map((booking, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.courtName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.timeSlot}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{booking.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900">Total:</span>
          <span className="text-2xl font-bold text-gray-900">₱{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Methods</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
              <span className="text-white font-bold text-sm">GC</span>
            </div>
            <span className="text-sm font-medium text-gray-700">GCash</span>
          </div>
          <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-2">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Maya</span>
          </div>
          <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-2">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-sm font-medium text-gray-700">GrabPay</span>
          </div>
          <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
              <span className="text-white font-bold text-sm">OB</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Online Banking</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Send Your payment to <strong>Budz Badminton Court</strong>
        </p>
      </div>

      {/* Payment Confirmation & No Refund Policy */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Payment Confirmation & No Refund Policy:
        </h3>
        <p className="text-sm text-yellow-700">
          By proceeding with payment, you confirm that the transaction is final and non-refundable. 
          Cancellations are not accepted. If you agree, please continue with the payment.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onBack}
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={() => onProceedToPayment(userInfo)}
          disabled={!userInfo.name || !userInfo.email || !userInfo.contactNumber}
          className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Pay Now
        </button>
      </div>
    </div>
  );
}
