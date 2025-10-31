import { Controller, Post, Body, Get, Param, Logger, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { PayMongoService } from './paymongo.service';
import { EmailReceiptService } from './email-receipt.service';
import { PaymentsService } from './payments.service';
import { PaymongoPaymentIntent, PaymongoPaymentMethod, PaymongoPayment } from './types/paymongo.types';

interface CreatePaymentIntentDto {
  amount: number;
  description?: string;
  metadata?: any;
}

interface ProcessPaymentDto {
  amount: number;
  paymentMethodType: 'card' | 'gcash' | 'paymaya' | 'grab_pay';
  paymentDetails: any;
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
  };
  description?: string;
  metadata?: any;
  reservationId?: number;
}

interface AttachPaymentMethodDto {
  paymentIntentId: string;
  paymentMethodId: string;
  returnUrl?: string;
}

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name)

  constructor(
    private readonly payMongoService: PayMongoService,
    private readonly emailReceiptService: EmailReceiptService,
    private readonly paymentsService: PaymentsService,
    @InjectRepository(EquipmentRental)
    private readonly rentalRepository: Repository<EquipmentRental>,
    @InjectRepository(EquipmentRentalItem)
    private readonly rentalItemRepository: Repository<EquipmentRentalItem>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
  ) {}

  @Post('create-intent')
  async createPaymentIntent(@Body() body: CreatePaymentIntentDto): Promise<{ success: boolean; data?: PaymongoPaymentIntent; message?: string }> {
    try {
      const { amount, description, metadata } = body;
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const paymentIntent = await this.payMongoService.createPaymentIntent(
        amount,
        'PHP',
        description,
        metadata
      );

      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      return {
        success: false,
        message: error.message || 'Failed to create payment intent',
      };
    }
  }

  @Get('intent/:paymentIntentId')
  async getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string): Promise<{ success: boolean; data?: PaymongoPaymentIntent; message?: string }> {
    try {
      const paymentIntent = await this.payMongoService.getPaymentIntent(paymentIntentId);
      
      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      this.logger.error('Error getting payment intent:', error);
      return {
        success: false,
        message: error.message || 'Failed to get payment intent',
      };
    }
  }

  // Rentals by reservation (for My Reservations modal)
  @Get('rentals/by-reservation/:reservationId')
  async getRentalsByReservation(@Param('reservationId') reservationId: number) {
    try {
      const rental = await this.rentalRepository.findOne({ where: { reservation_id: Number(reservationId) } });
      if (!rental) {
        return { success: true, data: { items: [], total: 0 } };
      }

      const items = await this.rentalItemRepository.find({ where: { rental_id: rental.id } });
      const equipmentMap = new Map<number, string>();
      for (const it of items) {
        if (it.equipment_id && !equipmentMap.has(it.equipment_id)) {
          const eq = await this.equipmentRepository.findOne({ where: { id: it.equipment_id } });
          if (eq) equipmentMap.set(it.equipment_id, eq.equipment_name);
        }
      }
      const dto = items.map((it) => ({
        equipmentId: it.equipment_id,
        equipmentName: equipmentMap.get(it.equipment_id) || 'Equipment',
        quantity: it.quantity,
        hours: it.hours,
        hourlyPrice: Number(it.hourly_price),
        subtotal: Number(it.subtotal),
      }));
      const total = dto.reduce((s, i) => s + i.subtotal, 0);
      return { success: true, data: { items: dto, total } };
    } catch (error) {
      this.logger.error('Error fetching rentals by reservation:', error);
      return { success: false, message: 'Failed to fetch rentals' };
    }
  }

  @Post('create-method')
  async createPaymentMethod(@Body() body: {
    type: 'card' | 'gcash' | 'paymaya' | 'grab_pay';
    details: any;
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
  }): Promise<{ success: boolean; data?: PaymongoPaymentMethod; message?: string }> {
    try {
      const { type, details, billing } = body;

      const paymentMethod = await this.payMongoService.createPaymentMethod(
        type,
        details,
        billing
      );

      return {
        success: true,
        data: paymentMethod,
      };
    } catch (error) {
      this.logger.error('Error creating payment method:', error);
      return {
        success: false,
        message: error.message || 'Failed to create payment method',
      };
    }
  }

  @Post('attach-method')
  async attachPaymentMethod(@Body() body: AttachPaymentMethodDto): Promise<{ success: boolean; data?: PaymongoPaymentIntent; message?: string }> {
    try {
      const { paymentIntentId, paymentMethodId, returnUrl } = body;

      const attachedIntent = await this.payMongoService.attachPaymentMethod(
        paymentIntentId,
        paymentMethodId,
        returnUrl
      );

      return {
        success: true,
        data: attachedIntent,
      };
    } catch (error) {
      this.logger.error('Error attaching payment method:', error);
      return {
        success: false,
        message: error.message || 'Failed to attach payment method',
      };
    }
  }

  @Post('process')
  async processPayment(@Body() body: ProcessPaymentDto) {
    try {
      const {
        amount,
        paymentMethodType,
        paymentDetails,
        billingInfo,
        description,
        metadata,
        reservationId
      } = body;

      // Process payment through Paymongo
      const paymentResult = await this.payMongoService.processPayment(
        amount,
        paymentMethodType,
        paymentDetails,
        billingInfo,
        description,
        metadata
      );

      // Save payment to database if reservationId is provided
      let savedPayment = null;
      if (reservationId) {
        try {
          savedPayment = await this.paymentsService.create({
            reservation_id: reservationId,
            amount: amount,
            payment_method: paymentMethodType.toUpperCase() as any,
            notes: `Paymongo Payment Intent: ${paymentResult.paymentIntent.id}`
          });
        } catch (dbError) {
          this.logger.warn('Failed to save payment to database:', dbError);
        }
      }

      // Send email receipt if payment is successful
      if (paymentResult.paymentIntent.attributes.status === 'succeeded') {
        try {
          await this.emailReceiptService.sendPaymentConfirmation({
            paymentId: paymentResult.paymentIntent.id,
            amount: paymentResult.paymentIntent.attributes.amount,
            currency: paymentResult.paymentIntent.attributes.currency,
            description: paymentResult.paymentIntent.attributes.description,
            status: paymentResult.paymentIntent.attributes.status,
            paidAt: new Date(),
            customerName: billingInfo.name,
            customerEmail: billingInfo.email,
            customerPhone: billingInfo.phone,
            billingAddress: billingInfo.address,
            paymentMethod: {
              type: paymentMethodType,
              last4: paymentResult.paymentMethod.attributes.details?.last4,
              exp_month: paymentResult.paymentMethod.attributes.details?.exp_month,
              exp_year: paymentResult.paymentMethod.attributes.details?.exp_year,
            },
            fee: 0, // Paymongo doesn't provide fee in payment intent
            netAmount: paymentResult.paymentIntent.attributes.amount,
            referenceNumber: savedPayment?.reference_number,
          });
        } catch (emailError) {
          this.logger.warn('Failed to send payment confirmation email:', emailError);
        }
      }

      return {
        success: true,
        data: {
          paymentIntent: paymentResult.paymentIntent,
          paymentMethod: paymentResult.paymentMethod,
          clientKey: paymentResult.clientKey,
          publicKey: paymentResult.publicKey,
          savedPayment
        },
      };
    } catch (error) {
      this.logger.error('Error processing payment:', error);
      return {
        success: false,
        message: error.message || 'Failed to process payment',
      };
    }
  }

  @Get('payment/:paymentId')
  async getPayment(@Param('paymentId') paymentId: string): Promise<{ success: boolean; data?: PaymongoPayment; message?: string }> {
    try {
      const payment = await this.payMongoService.getPayment(paymentId);
      
      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      this.logger.error('Error getting payment:', error);
      return {
        success: false,
        message: error.message || 'Failed to get payment',
      };
    }
  }

  @Get('payments')
  async listPayments(@Param('limit') limit?: number): Promise<{ success: boolean; data?: PaymongoPayment[]; message?: string }> {
    try {
      const payments = await this.payMongoService.listPayments(limit || 10);
      
      return {
        success: true,
        data: payments,
      };
    } catch (error) {
      this.logger.error('Error listing payments:', error);
      return {
        success: false,
        message: error.message || 'Failed to list payments',
      };
    }
  }

  // Legacy method for backward compatibility
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

  // Create checkout with payment source for redirect-based payments
  @Post('create-checkout-with-source')
  async createCheckoutWithSource(@Body() body: { amount: number; description?: string; returnUrl?: string }) {
    try {
      const { amount, description, returnUrl } = body;
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const checkoutSession = await this.payMongoService.createCheckoutSessionWithSource(
        amount,
        'PHP',
        description,
        returnUrl
      );

      return {
        success: true,
        data: checkoutSession,
      };
    } catch (error) {
      this.logger.error('Error creating checkout session with source:', error);
      return {
        success: false,
        message: error.message || 'Failed to create checkout session with source',
      };
    }
  }

  // Create checkout with redirect URL for Paymongo's hosted checkout
  @Post('create-checkout-redirect')
  async createCheckoutRedirect(@Body() body: { amount: number; description?: string; returnUrl?: string }) {
    try {
      const { amount, description, returnUrl } = body;
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const checkoutSession = await this.payMongoService.createCheckoutSessionWithRedirect(
        amount,
        'PHP',
        description,
        returnUrl
      );

      return {
        success: true,
        data: checkoutSession,
      };
    } catch (error) {
      this.logger.error('Error creating checkout session with redirect:', error);
      return {
        success: false,
        message: error.message || 'Failed to create checkout session with redirect',
      };
    }
  }

  // Create proper Paymongo checkout that allows user to choose payment method
  @Post('create-paymongo-checkout')
  async createPaymongoCheckout(@Body() body: { 
    amount: number; 
    description?: string; 
    returnUrl?: string;
    billingInfo?: {
      name: string;
      email: string;
      phone: string;
    };
    bookingData?: string;
  }) {
    try {
      const { amount, description, returnUrl, billingInfo, bookingData } = body;
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Parse booking data if provided
      let parsedBookingData = null;
      if (bookingData) {
        try {
          parsedBookingData = JSON.parse(bookingData);
        } catch (error) {
          this.logger.warn('Failed to parse booking data:', error);
        }
      }

      const checkoutSession = await this.payMongoService.createPaymongoCheckout(
        amount,
        'PHP',
        description,
        returnUrl,
        billingInfo,
        parsedBookingData
      );

      return {
        success: true,
        data: checkoutSession,
      };
    } catch (error) {
      this.logger.error('Error creating Paymongo checkout:', error);
      return {
        success: false,
        message: error.message || 'Failed to create Paymongo checkout',
      };
    }
  }

  @Get('status/:paymentIntentId')
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string): Promise<{ success: boolean; data?: PaymongoPaymentIntent; message?: string }> {
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

  @Get('receipt/:paymentId')
  async getReceipt(@Param('paymentId') paymentId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const payment = await this.payMongoService.getPayment(paymentId);
      
      // Paymongo provides receipt URLs in the payment object
      const receiptData = {
        paymentId: payment.id,
        amount: payment.attributes.amount,
        currency: payment.attributes.currency,
        status: payment.attributes.status,
        paidAt: payment.attributes.paid_at ? new Date(payment.attributes.paid_at * 1000) : null,
        receipt_url: `https://paymongo.com/receipts/${payment.id}`, // This would be the actual receipt URL
        billing: payment.attributes.billing,
        description: payment.attributes.description,
      };

      return {
        success: true,
        data: receiptData,
      };
    } catch (error) {
      this.logger.error('Error getting receipt:', error);
      return {
        success: false,
        message: error.message || 'Failed to get receipt',
      };
    }
  }
}