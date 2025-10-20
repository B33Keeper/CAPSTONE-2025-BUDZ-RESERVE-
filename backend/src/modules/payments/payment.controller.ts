import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { PayMongoService } from './paymongo.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly payMongoService: PayMongoService) {}

  @Post('create-checkout')
  async createCheckout(@Body() body: { amount: number; description?: string }) {
    try {
      const { amount, description } = body;
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const checkoutSession = await this.payMongoService.createCheckoutSession(
        amount,
        'PHP',
        description
      );

      return {
        success: true,
        data: checkoutSession,
      };
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      return {
        success: false,
        message: error.message || 'Failed to create checkout session',
      };
    }
  }

  @Get('status/:paymentIntentId')
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    try {
      const paymentIntent = await this.payMongoService.getPaymentIntent(paymentIntentId);
      
      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      this.logger.error('Error getting payment status:', error);
      return {
        success: false,
        message: error.message || 'Failed to get payment status',
      };
    }
  }
}
