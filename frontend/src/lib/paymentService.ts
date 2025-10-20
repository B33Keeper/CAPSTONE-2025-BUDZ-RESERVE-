const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface PaymentCheckoutResponse {
  success: boolean;
  data?: {
    paymentIntentId: string;
    checkoutUrl: string;
    clientKey: string;
  };
  message?: string;
}

export class PaymentService {
  static async createCheckout(amount: number, description?: string): Promise<PaymentCheckoutResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment service error:', error);
      return {
        success: false,
        message: 'Failed to create checkout session',
      };
    }
  }

  static async getPaymentStatus(paymentIntentId: string): Promise<PaymentCheckoutResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/status/${paymentIntentId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment status error:', error);
      return {
        success: false,
        message: 'Failed to get payment status',
      };
    }
  }
}
