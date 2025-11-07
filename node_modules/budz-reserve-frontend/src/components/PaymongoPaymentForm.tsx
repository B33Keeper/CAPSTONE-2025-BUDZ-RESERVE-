import React, { useState } from 'react';
import { CreditCard, Smartphone, Wallet, Zap } from 'lucide-react';
import { PaymentService } from '../lib/paymentService';

interface PaymongoPaymentFormProps {
  amount: number;
  description?: string;
  reservationId?: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

interface BillingInfo {
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'gcash', name: 'GCash', icon: Smartphone, color: 'bg-green-500' },
  { id: 'paymaya', name: 'PayMaya', icon: Wallet, color: 'bg-purple-500' },
  { id: 'grab_pay', name: 'GrabPay', icon: Zap, color: 'bg-orange-500' },
];

export function PaymongoPaymentForm({ 
  amount, 
  description, 
  reservationId, 
  onSuccess, 
  onError 
}: PaymongoPaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'PH',
    },
  });
  const [cardDetails, setCardDetails] = useState({
    card_number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'method' | 'billing' | 'payment'>('method');

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep('billing');
  };

  const handleBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Prepare payment details based on selected method
      let paymentDetails = {};
      
      if (selectedMethod === 'card') {
        paymentDetails = {
          card_number: cardDetails.card_number.replace(/\s/g, ''),
          exp_month: parseInt(cardDetails.exp_month),
          exp_year: parseInt(cardDetails.exp_year),
          cvc: cardDetails.cvc,
        };
      } else {
        // For other payment methods, details are handled by Paymongo
        paymentDetails = {};
      }

      // Process payment
      const result = await PaymentService.processPayment(
        amount,
        selectedMethod as any,
        paymentDetails,
        billingInfo,
        description,
        { reservationId },
        reservationId
      );

      if (result.success) {
        onSuccess(result.data);
      } else {
        onError(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
  };

  if (step === 'method') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => handleMethodSelect(method.id)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${method.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900">{method.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 'billing') {
    return (
      <form onSubmit={handleBillingSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={billingInfo.name}
              onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={billingInfo.email}
              onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={billingInfo.phone}
            onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 *
          </label>
          <input
            type="text"
            required
            value={billingInfo.address.line1}
            onChange={(e) => setBillingInfo({ 
              ...billingInfo, 
              address: { ...billingInfo.address, line1: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            value={billingInfo.address.line2}
            onChange={(e) => setBillingInfo({ 
              ...billingInfo, 
              address: { ...billingInfo.address, line2: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              required
              value={billingInfo.address.city}
              onChange={(e) => setBillingInfo({ 
                ...billingInfo, 
                address: { ...billingInfo.address, city: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              required
              value={billingInfo.address.state}
              onChange={(e) => setBillingInfo({ 
                ...billingInfo, 
                address: { ...billingInfo.address, state: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code *
            </label>
            <input
              type="text"
              required
              value={billingInfo.address.postal_code}
              onChange={(e) => setBillingInfo({ 
                ...billingInfo, 
                address: { ...billingInfo.address, postal_code: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => setStep('method')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    );
  }

  if (step === 'payment') {
    const selectedMethodInfo = paymentMethods.find(m => m.id === selectedMethod);
    const Icon = selectedMethodInfo?.icon || CreditCard;

    return (
      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
        
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div className={`p-2 rounded-lg ${selectedMethodInfo?.color} text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-medium text-gray-900">{selectedMethodInfo?.name}</span>
        </div>

        {selectedMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number *
              </label>
              <input
                type="text"
                required
                placeholder="1234 5678 9012 3456"
                value={cardDetails.card_number}
                onChange={(e) => setCardDetails({ 
                  ...cardDetails, 
                  card_number: formatCardNumber(e.target.value) 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  value={cardDetails.exp_month}
                  onChange={(e) => setCardDetails({ 
                    ...cardDetails, 
                    exp_month: formatExpiry(e.target.value) 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={5}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC *
                </label>
                <input
                  type="text"
                  required
                  placeholder="123"
                  value={cardDetails.cvc}
                  onChange={(e) => setCardDetails({ 
                    ...cardDetails, 
                    cvc: e.target.value.replace(/\D/g, '') 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        )}

        {selectedMethod !== 'card' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              You will be redirected to {selectedMethodInfo?.name} to complete your payment.
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-xl font-bold text-blue-600">
              ₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => setStep('billing')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isProcessing}
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Pay ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          </button>
        </div>
      </form>
    );
  }

  return null;
}
