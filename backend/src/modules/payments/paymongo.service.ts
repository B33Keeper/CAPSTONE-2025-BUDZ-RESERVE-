import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PayMongoService {
  private readonly logger = new Logger(PayMongoService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl = 'https://api.paymongo.com/v1';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYMONGO_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('PAYMONGO_PUBLIC_KEY') || '';
  }

  async createPaymentIntent(amount: number, currency: string = 'PHP', description?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(amount * 100), // Convert to centavos
              currency,
              description: description || 'Badminton Court Booking',
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
      this.logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async createPaymentSource(paymentIntentId: string, type: string = 'gcash') {
    try {
      const response = await fetch(`${this.baseUrl}/sources`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type,
              amount: 0, // Will be set by payment intent
              currency: 'PHP',
              redirect: {
                success: `${this.configService.get('FRONTEND_URL')}/payment/success`,
                failed: `${this.configService.get('FRONTEND_URL')}/payment/failed`,
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

  async attachPaymentSource(paymentIntentId: string, sourceId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
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

  async createCheckoutSession(amount: number, currency: string = 'PHP', description?: string) {
    try {
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(amount, currency, description);
      
      // Create payment source
      const source = await this.createPaymentSource(paymentIntent.id);
      
      // Attach source to payment intent
      const attachedIntent = await this.attachPaymentSource(paymentIntent.id, source.id);
      
      return {
        paymentIntentId: paymentIntent.id,
        checkoutUrl: source.attributes.redirect.checkout_url,
        clientKey: paymentIntent.attributes.client_key,
      };
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
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
}
