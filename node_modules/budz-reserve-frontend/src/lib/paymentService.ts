const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface PaymentCheckoutResponse {
  success: boolean;
  data?: {
    paymentIntentId: string;
    checkoutUrl: string;
    clientKey: string;
    publicKey: string;
    amount: number;
    currency: string;
    status: string;
  };
  message?: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  data?: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      currency: string;
      description: string;
      status: string;
      client_key: string;
      payment_method_allowed: string[];
      created_at: number;
      updated_at: number;
    };
  };
  message?: string;
}

export interface PaymentMethodResponse {
  success: boolean;
  data?: {
    id: string;
    type: string;
    attributes: {
      type: string;
      billing: {
        name: string;
        email: string;
        phone: string;
        address: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
        };
      };
      details?: {
        last4?: string;
        exp_month?: number;
        exp_year?: number;
      };
    };
  };
  message?: string;
}

export interface ProcessPaymentResponse {
  success: boolean;
  data?: {
    paymentIntent: any;
    paymentMethod: any;
    clientKey: string;
    publicKey: string;
    savedPayment?: any;
  };
  message?: string;
}

export class PaymentService {
  // Create Payment Intent
  static async createPaymentIntent(amount: number, description?: string, metadata?: any): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description,
          metadata,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment intent creation error:', error);
      return {
        success: false,
        message: 'Failed to create payment intent',
      };
    }
  }

  // Get Payment Intent
  static async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/intent/${paymentIntentId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment intent retrieval error:', error);
      return {
        success: false,
        message: 'Failed to get payment intent',
      };
    }
  }

  // Create Payment Method
  static async createPaymentMethod(
    type: 'card' | 'gcash' | 'paymaya' | 'grab_pay',
    details: any,
    billing: {
      name: string;
      email: string;
      phone: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    }
  ): Promise<PaymentMethodResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          details,
          billing,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment method creation error:', error);
      return {
        success: false,
        message: 'Failed to create payment method',
      };
    }
  }

  // Attach Payment Method to Payment Intent
  static async attachPaymentMethod(
    paymentIntentId: string,
    paymentMethodId: string,
    returnUrl?: string
  ): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/attach-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
          returnUrl,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment method attachment error:', error);
      return {
        success: false,
        message: 'Failed to attach payment method',
      };
    }
  }

  // Process Complete Payment
  static async processPayment(
    amount: number,
    paymentMethodType: 'card' | 'gcash' | 'paymaya' | 'grab_pay',
    paymentDetails: any,
    billingInfo: {
      name: string;
      email: string;
      phone: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    },
    description?: string,
    metadata?: any,
    reservationId?: number
  ): Promise<ProcessPaymentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentMethodType,
          paymentDetails,
          billingInfo,
          description,
          metadata,
          reservationId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        message: 'Failed to process payment',
      };
    }
  }

  // Legacy method for backward compatibility
  static async createCheckout(amount: number, description?: string, billingInfo?: { name: string; email: string; contactNumber: string }, bookingData?: any): Promise<PaymentCheckoutResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create-paymongo-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description,
          returnUrl: `${window.location.origin}/payment/success`,
          billingInfo: billingInfo || {
            name: 'Customer',
            email: 'customer@example.com',
            phone: '09123456789'
          },
          bookingData: bookingData ? JSON.stringify(bookingData) : null
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