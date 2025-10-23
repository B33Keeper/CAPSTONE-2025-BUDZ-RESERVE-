import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { PaymongoPaymentForm } from './PaymongoPaymentForm';

interface PaymongoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description?: string;
  reservationId?: number;
  onPaymentSuccess: (paymentData: any) => void;
}

export function PaymongoPaymentModal({
  isOpen,
  onClose,
  amount,
  description,
  reservationId,
  onPaymentSuccess,
}: PaymongoPaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handlePaymentSuccess = (paymentData: any) => {
    setPaymentStatus('success');
    setTimeout(() => {
      onPaymentSuccess(paymentData);
      onClose();
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    setErrorMessage(error);
  };

  const handleClose = () => {
    setPaymentStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentStatus === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Failed
              </h3>
              <p className="text-gray-600 mb-4">
                {errorMessage}
              </p>
              <button
                onClick={() => setPaymentStatus('idle')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}

          {paymentStatus === 'idle' && (
            <PaymongoPaymentForm
              amount={amount}
              description={description}
              reservationId={reservationId}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
