import { Controller, Post, Body, Get, Param, Logger, Request } from '@nestjs/common';
import { PayMongoService } from './paymongo.service';
import { PaymentsService } from './payments.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly payMongoService: PayMongoService,
    private readonly paymentsService: PaymentsService,
  ) {}

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

  @Get('checkout-status/:linkId')
  async getCheckoutStatus(@Param('linkId') linkId: string) {
    try {
      const checkoutLink = await this.payMongoService.getCheckoutLink(linkId);
      
      return {
        success: true,
        data: checkoutLink,
      };
    } catch (error) {
      this.logger.error('Error getting checkout status:', error);
      return {
        success: false,
        message: error.message || 'Failed to get checkout status',
      };
    }
  }

  @Post('finalize')
  async finalizePayment(
    @Body() body: {
      reservationData: any;
      paymentIntentId: string;
      amount: number;
      paymentMethod: string;
      userId: number;
    },
    @Request() req: any,
  ) {
    try {
      const { reservationData, paymentIntentId, amount, paymentMethod, userId } = body;
      
      // Use userId from body or fallback to authenticated user
      const finalUserId = userId || req.user?.id;
      
      if (!finalUserId) {
        throw new Error('User ID is required');
      }
      
      const result = await this.paymentsService.finalizePayment(
        reservationData,
        paymentIntentId,
        amount,
        paymentMethod,
        finalUserId,
      );
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error finalizing payment:', error);
      return {
        success: false,
        message: error.message || 'Failed to finalize payment',
      };
    }
  }
}
