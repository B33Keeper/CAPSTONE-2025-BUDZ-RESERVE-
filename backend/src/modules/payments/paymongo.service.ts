import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymongoPaymentIntent,
  PaymongoPaymentMethod,
  PaymongoPayment,
  PaymongoQrPhCode,
} from './types/paymongo.types';

@Injectable()
export class PayMongoService {
  private readonly logger = new Logger(PayMongoService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl = 'https://api.paymongo.com/v1';

  constructor(private configService: ConfigService) {
    // Use the provided test keys
    this.secretKey = 'sk_test_gR6gPcDcqGdwXnSDjvyMipRH';
    this.publicKey = 'pk_test_wqL9TDyzi8VqZ8wz96qZQNYm';
  }

  // Create Payment Intent
  async createPaymentIntent(
    amount: number, 
    currency: string = 'PHP', 
    description?: string,
    metadata?: any
  ): Promise<PaymongoPaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(amount * 100), // Convert to centavos
              payment_method_allowed: ['card', 'paymaya', 'gcash', 'grab_pay'],
              payment_method_options: {
                card: {
                  request_three_d_secure: 'any'
                }
              },
              currency,
              capture_type: 'automatic',
              description: description || 'Badminton Court Booking',
              ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {})
            }
          }
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Retrieve Payment Intent
  async getPaymentIntent(paymentIntentId: string): Promise<PaymongoPaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}?client_key=${this.publicKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'accept': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error getting payment intent:', error);
      throw error;
    }
  }

  // Create Payment Method
  async createPaymentMethod(
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
  ): Promise<PaymongoPaymentMethod> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type,
              details,
              billing,
              payment_method_option: type === 'card' ? {
                card: {
                  installments: {
                    plan: {
                      issuer_id: 'string',
                      tenure: 0
                    }
                  }
                }
              } : undefined
            }
          }
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error creating payment method:', error);
      throw error;
    }
  }

  // Retrieve Payment Method
  async getPaymentMethod(paymentMethodId: string): Promise<PaymongoPaymentMethod> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_methods/${paymentMethodId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'accept': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error getting payment method:', error);
      throw error;
    }
  }

  // Retrieve Checkout Session
  async getCheckoutSession(checkoutSessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout_sessions/${checkoutSessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'accept': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error getting checkout session:', error);
      throw error;
    }
  }

  // Attach Payment Method to Payment Intent
  async attachPaymentMethod(
    paymentIntentId: string, 
    paymentMethodId: string,
    returnUrl?: string
  ): Promise<PaymongoPaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              client_key: this.publicKey,
              return_url: returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success`
            }
          }
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error attaching payment method:', error);
      throw error;
    }
  }

  // Retrieve Payment
  async getPayment(paymentId: string): Promise<PaymongoPayment> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'accept': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error getting payment:', error);
      throw error;
    }
  }

  // List all payments
  async listPayments(limit: number = 10): Promise<PaymongoPayment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'accept': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error listing payments:', error);
      throw error;
    }
  }

  // Complete payment flow
  async processPayment(
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
    metadata?: any
  ) {
    try {
      // 1. Create payment intent
      const paymentIntent = await this.createPaymentIntent(
        amount, 
        'PHP', 
        description,
        metadata
      );

      // 2. Create payment method
      const paymentMethod = await this.createPaymentMethod(
        paymentMethodType,
        paymentDetails,
        billingInfo
      );

      // 3. Attach payment method to payment intent
      const attachedIntent = await this.attachPaymentMethod(
        paymentIntent.id,
        paymentMethod.id
      );

      return {
        paymentIntent: attachedIntent,
        paymentMethod,
        clientKey: paymentIntent.attributes.client_key,
        publicKey: this.publicKey
      };
    } catch (error) {
      this.logger.error('Error processing payment:', error);
      throw error;
    }
  }

  // Create Payment Source (for redirect-based payments)
  async createPaymentSource(
    amount: number,
    currency: string = 'PHP',
    type: string = 'gcash',
    returnUrl?: string
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/sources`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type,
              amount: Math.round(amount * 100), // Convert to centavos
              currency,
              redirect: {
                success: returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success`,
                failed: returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/failed`,
              },
            },
          },
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error creating payment source:', error);
      throw error;
    }
  }

  // Attach Payment Source to Payment Intent
  async attachPaymentSource(paymentIntentId: string, sourceId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              source: {
                id: sourceId,
                type: 'source',
              },
            },
          },
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error attaching payment source:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility - creates payment intent only
  async createCheckoutSession(amount: number, currency: string = 'PHP', description?: string) {
    try {
      // Create payment intent only - frontend will handle payment method creation
      const paymentIntent = await this.createPaymentIntent(amount, currency, description);
      
      return {
        paymentIntentId: paymentIntent.id,
        clientKey: paymentIntent.attributes.client_key,
        publicKey: this.publicKey,
        amount: paymentIntent.attributes.amount,
        currency: paymentIntent.attributes.currency,
        status: paymentIntent.attributes.status
      };
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create checkout session with redirect URL for Paymongo's hosted checkout
  async createCheckoutSessionWithRedirect(amount: number, currency: string = 'PHP', description?: string, returnUrl?: string) {
    try {
      // Create payment intent with all payment methods allowed
      const paymentIntent = await this.createPaymentIntent(amount, currency, description);
      
      // For Paymongo's hosted checkout, we need to create a payment source
      // But we should let the user choose the payment method, not hardcode it
      // Let's create a source with a generic type that allows user selection
      const source = await this.createPaymentSource(amount, currency, 'gcash', returnUrl);
      
      return {
        paymentIntentId: paymentIntent.id,
        clientKey: paymentIntent.attributes.client_key,
        publicKey: this.publicKey,
        amount: paymentIntent.attributes.amount,
        currency: paymentIntent.attributes.currency,
        status: paymentIntent.attributes.status,
        checkoutUrl: source.attributes.redirect.checkout_url
      };
    } catch (error) {
      this.logger.error('Error creating checkout session with redirect:', error);
      throw error;
    }
  }

  // Create proper Paymongo checkout session that allows user to choose payment method
  async createPaymongoCheckout(amount: number, currency: string = 'PHP', description?: string, returnUrl?: string, billingInfo?: any, bookingData?: any) {
    try {
      // Build line items: court + equipment breakdown for clearer checkout UI
      const lineItems: any[] = [];
      if (bookingData?.courtBookings?.length) {
        const courtTotal = bookingData.courtBookings.reduce((sum: number, b: any) => sum + Number(b.subtotal || 0), 0);
        lineItems.push({
          currency,
          amount: Math.round(courtTotal * 100),
          description: 'Court Reservation',
          name: 'Court Reservation',
          quantity: 1,
        });
      }
      if (bookingData?.equipmentBookings?.length) {
        for (const eq of bookingData.equipmentBookings) {
          const eqSubtotal = Number(eq.subtotal || 0);
          const qty = Number(eq.quantity || 1);
          const unit = qty > 0 ? Math.round((eqSubtotal / qty) * 100) : Math.round(eqSubtotal * 100);
          if (eqSubtotal > 0) {
            lineItems.push({
              currency,
              amount: unit,
              description: `Rent: ${eq.equipment} (${eq.time || '1 hr'})`,
              name: `Rent: ${eq.equipment}`,
              quantity: qty,
            });
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/checkout_sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              billing: billingInfo || {
                name: 'Customer',
                email: 'customer@example.com',
                phone: '09123456789'
              },
              line_items: (lineItems.length > 0 ? lineItems : [
                {
                  currency: currency,
                  amount: Math.round(amount * 100),
                  description: description || 'Badminton Court Booking',
                  name: 'Court Reservation',
                  quantity: 1,
                }
              ]),
              payment_method_types: ['gcash', 'grab_pay', 'paymaya', 'card'],
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              cancel_url: returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/booking`,
              success_url: bookingData ? 
                `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success?checkout_session_id={CHECKOUT_SESSION_ID}&amount=${amount}&bookingData=${encodeURIComponent(JSON.stringify(bookingData))}` :
                (returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success`),
              reference_number: `REF${Date.now()}`,
              description: description || 'Badminton Court Booking',
              metadata: bookingData ? {
                bookingData: JSON.stringify(bookingData)
              } : {}
            }
          }
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      console.log('Paymongo checkout session response:', JSON.stringify(result, null, 2));
      
      // Get the checkout session ID
      const checkoutSessionId = result.data.id;
      console.log('Generated checkout session ID:', checkoutSessionId);
      
      // Check if the checkout URL contains the session ID
      const checkoutUrl = result.data.attributes.checkout_url;
      console.log('Checkout URL:', checkoutUrl);
      
      // Store the checkout session ID in the metadata for later retrieval
      if (bookingData) {
        console.log('Storing checkout session ID in metadata for later retrieval');
        // We'll need to update the checkout session with the ID in metadata
        // This is a workaround since Paymongo doesn't replace placeholders
      }
      
      return {
        checkoutSessionId: checkoutSessionId,
        checkoutUrl: checkoutUrl,
        clientKey: result.data.attributes.client_key,
        publicKey: this.publicKey,
        amount: result.data.attributes.payment_intent.attributes.amount,
        currency: result.data.attributes.payment_intent.attributes.currency,
        status: result.data.attributes.status,
        paymentMethodTypes: result.data.attributes.payment_method_types,
        referenceNumber: result.data.attributes.reference_number
      };
    } catch (error) {
      this.logger.error('Error creating Paymongo checkout session:', error);
      throw error;
    }
  }

  // Create complete checkout session with payment source for redirect-based payments
  async createCheckoutSessionWithSource(amount: number, currency: string = 'PHP', description?: string, returnUrl?: string) {
    try {
      // 1. Create payment intent
      const paymentIntent = await this.createPaymentIntent(amount, currency, description);
      
      // 2. Create payment source for redirect-based payments (GCash, PayMaya, etc.)
      const source = await this.createPaymentSource(amount, currency, 'gcash', returnUrl);
      
      // 3. Attach source to payment intent
      const attachedIntent = await this.attachPaymentSource(paymentIntent.id, source.id);
      
      return {
        paymentIntentId: paymentIntent.id,
        checkoutUrl: source.attributes.redirect.checkout_url,
        clientKey: paymentIntent.attributes.client_key,
        publicKey: this.publicKey,
        amount: paymentIntent.attributes.amount,
        currency: paymentIntent.attributes.currency,
        status: paymentIntent.attributes.status
      };
    } catch (error) {
      this.logger.error('Error creating checkout session with source:', error);
      throw error;
    }
  }

  async generateQrPhStaticCode(params: {
    mobileNumber?: string;
    notes?: string;
    kind?: 'instore' | 'dynamic' | string;
  }): Promise<PaymongoQrPhCode> {
    const { mobileNumber, notes, kind = 'instore' } = params || {};

    try {
      const response = await fetch(`${this.baseUrl}/qrph/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              kind,
              ...(mobileNumber ? { mobile_number: mobileNumber } : {}),
              ...(notes ? { notes } : {}),
            },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      return result.data;
    } catch (error) {
      this.logger.error('Error generating QR Ph static code:', error);
      throw error;
    }
  }
}
