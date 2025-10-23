import { Controller, Post, Body, Headers, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayMongoService } from './paymongo.service';
import { EmailReceiptService } from './email-receipt.service';
import { PaymentsService } from './payments.service';
import { Payment, PaymentMethod, PaymentStatus } from './entities/payment.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { CourtsService } from '../courts/courts.service';

interface PaymongoWebhookEvent {
  data: {
    id: string;
    type: string;
    attributes: {
      type: string;
      livemode: boolean;
      data: {
        id: string;
        type: string;
        attributes: any;
      };
      created_at: number;
    };
  };
}

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly payMongoService: PayMongoService,
    private readonly emailReceiptService: EmailReceiptService,
    private readonly paymentsService: PaymentsService,
    private readonly courtsService: CourtsService,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  @Post('test-webhook')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() testData: any) {
    this.logger.log('Processing test webhook');
    
    try {
      // Simulate a payment.paid event
      const mockWebhookEvent = {
        data: {
          id: testData.checkoutSessionId || 'cs_test123',
          type: 'checkout_session',
          attributes: {
            type: 'payment.paid',
            data: {
              id: testData.paymentId || 'pay_test123',
              type: 'payment',
              attributes: {
                amount: testData.amount * 100, // Convert to centavos
                currency: 'PHP',
                status: 'paid',
                description: 'Badminton Court Booking',
                source: {
                  id: testData.paymentMethodId || 'pm_test123',
                  type: testData.paymentMethod || 'gcash'
                },
                billing: {
                  name: testData.customerName || 'Test Customer',
                  email: testData.customerEmail || 'test@example.com',
                  phone: testData.customerPhone || '+639123456789',
                  address: testData.customerAddress || 'Test Address'
                },
                metadata: {
                  bookingData: JSON.stringify(testData.bookingData)
                }
              }
            }
          }
        }
      };
      
      // For test webhook, create reservation and payment directly without calling Paymongo API
      await this.handleTestPayment(mockWebhookEvent.data.attributes.data, testData);
      
      return { success: true, message: 'Test webhook processed successfully' };
    } catch (error) {
      this.logger.error('Error in test webhook:', error);
      return { success: false, message: 'Test webhook failed', error: error.message };
    }
  }

  @Post('paymongo')
  @HttpCode(HttpStatus.OK)
  async handlePaymongoWebhook(
    @Body() body: PaymongoWebhookEvent,
    @Headers('paymongo-signature') signature: string,
  ) {
    try {
      this.logger.log('Paymongo webhook received');
      

      // Verify webhook signature (implement proper verification)
      // For now, we'll process all webhooks in test mode
      if (!this.verifyWebhookSignature(body, signature)) {
        this.logger.warn('Invalid webhook signature');
        return { success: false, message: 'Invalid signature' };
      }

      const { data } = body;
      const eventType = data.attributes.type;
      const paymentData = data.attributes.data;
      
      this.logger.log(`Processing ${eventType} event`);

      switch (eventType) {
        case 'payment.paid':
          await this.handlePaymentPaid(paymentData);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(paymentData);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(paymentData);
          break;
        case 'payment_intent.failed':
          await this.handlePaymentIntentFailed(paymentData);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${eventType}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  private async handlePaymentPaid(paymentData: any) {
    try {
      this.logger.log(`Processing payment: ${paymentData.id}`);

      // Get full payment details from Paymongo
      const payment = await this.payMongoService.getPayment(paymentData.id);
      
      // Create reservation FIRST if booking data is in metadata
      let reservationId = 0;
      if (payment.attributes.metadata && payment.attributes.metadata.bookingData) {
        try {
          const bookingData = JSON.parse(payment.attributes.metadata.bookingData);
          const createdReservations = await this.createReservationFromPayment(payment, bookingData);
          
          // Get the first created reservation ID
          if (createdReservations.length > 0) {
            reservationId = createdReservations[0].Reservation_ID;
            this.logger.log(`Created reservation ${reservationId}`);
          }
        } catch (error) {
          this.logger.error('Error creating reservation from payment metadata:', error);
        }
      }
      
      // Create payment record in local database with the reservation ID
      const newPayment = this.paymentRepository.create({
        reservation_id: reservationId, // Use the actual reservation ID
        amount: payment.attributes.amount / 100, // Convert from centavos
        payment_method: this.mapPaymentMethod(payment.attributes.source?.type),
        transaction_id: payment.id,
        reference_number: `REF${Date.now()}`, // Paymongo doesn't provide reference_number in payment object
        notes: payment.attributes.description,
        status: payment.attributes.status === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
      });
      await this.paymentRepository.save(newPayment);
      this.logger.log(`Created payment record ${newPayment.id}`);
      
      // Send detailed receipt email
      await this.emailReceiptService.sendPaymentReceipt({
        paymentId: payment.id,
        amount: payment.attributes.amount,
        currency: payment.attributes.currency,
        description: payment.attributes.description,
        status: payment.attributes.status,
        paidAt: payment.attributes.paid_at ? new Date(payment.attributes.paid_at * 1000) : new Date(),
        customerName: payment.attributes.billing.name,
        customerEmail: payment.attributes.billing.email,
        customerPhone: payment.attributes.billing.phone,
        billingAddress: payment.attributes.billing.address,
        paymentMethod: {
          type: payment.attributes.source?.type || 'UNKNOWN',
          last4: '****', // Paymongo source object doesn't have last4 property
        },
        fee: payment.attributes.fee,
        netAmount: payment.attributes.net_amount,
      });

      this.logger.log('Payment receipt sent');
    } catch (error) {
      this.logger.error('Error handling payment.paid event:', error);
    }
  }

  private async createReservationFromPayment(payment: any, bookingData: any): Promise<Reservation[]> {
    const createdReservations: Reservation[] = [];
    try {
      // Create reservation for each court booking
      for (const courtBooking of bookingData.courtBookings || []) {
        // For now, we'll create a simple reservation
        // In a real implementation, you'd need to map court names to IDs
        const reservation = this.reservationRepository.create({
          User_ID: bookingData.userId,
          Court_ID: 1, // Default court ID - this should be mapped from court name
          Reservation_Date: new Date(bookingData.selectedDate),
          Start_Time: '09:00:00', // This should be parsed from schedule
          End_Time: '10:00:00',   // This should be parsed from schedule
          Total_Amount: payment.attributes.amount / 100, // Convert from centavos
          Reference_Number: `REF${Date.now()}`,
          Paymongo_Reference_Number: payment.id,
          Notes: `Payment via Paymongo - ${payment.id}`,
          Status: ReservationStatus.CONFIRMED,
        });

        const savedReservation = await this.reservationRepository.save(reservation);
        createdReservations.push(savedReservation);
        this.logger.log(`Created reservation ${savedReservation.Reservation_ID} for payment ${payment.id}`);
      }
    } catch (error) {
      this.logger.error('Error creating reservation from payment:', error);
      throw error;
    }
    return createdReservations;
  }

  private async handlePaymentFailed(paymentData: any) {
    try {
      this.logger.log('Processing payment.failed event:', paymentData.id);
      
      // Update payment status in database if exists
      // This would require finding the payment by Paymongo ID
      // For now, just log the failure
      this.logger.warn(`Payment failed: ${paymentData.id}`);
    } catch (error) {
      this.logger.error('Error handling payment.failed event:', error);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntentData: any) {
    try {
      this.logger.log('Processing payment_intent.succeeded event:', paymentIntentData.id);
      
      // Update payment intent status in database if exists
      // Send confirmation email
      this.logger.log(`Payment intent succeeded: ${paymentIntentData.id}`);
    } catch (error) {
      this.logger.error('Error handling payment_intent.succeeded event:', error);
    }
  }

  private async handlePaymentIntentFailed(paymentIntentData: any) {
    try {
      this.logger.log('Processing payment_intent.failed event:', paymentIntentData.id);
      
      // Update payment intent status in database if exists
      this.logger.warn(`Payment intent failed: ${paymentIntentData.id}`);
    } catch (error) {
      this.logger.error('Error handling payment_intent.failed event:', error);
    }
  }

  private verifyWebhookSignature(body: any, signature: string): boolean {
    // TODO: Implement proper webhook signature verification using the secret key
    // Secret key: whsk_MVahvXgqKjLYjdWyTe5Zbznv
    // For now, we'll accept all webhooks in test mode
    return true;
  }

  private async handleTestPayment(paymentData: any, testData: any) {
    try {
      this.logger.log('Processing test payment');

      // Create reservation FIRST
      let reservationId = 0;
      if (testData.bookingData) {
        try {
          const createdReservations = await this.createReservationFromTestData(testData.bookingData);
          
          // Get the first created reservation ID
          if (createdReservations.length > 0) {
            reservationId = createdReservations[0].Reservation_ID;
            this.logger.log(`Created test reservation ${reservationId}`);
          }
        } catch (error) {
          this.logger.error('Error creating test reservation:', error);
        }
      }
      
      // Create payment record in local database with the reservation ID
      const newPayment = this.paymentRepository.create({
        reservation_id: reservationId,
        amount: testData.amount,
        payment_method: this.mapPaymentMethod(testData.paymentMethod),
        transaction_id: testData.paymentId,
        reference_number: `REF${Date.now()}`,
        notes: `Test payment - ${testData.paymentMethod}`,
        status: PaymentStatus.COMPLETED,
      });
      await this.paymentRepository.save(newPayment);
      this.logger.log(`Created test payment record ${newPayment.id}`);
      
    } catch (error) {
      this.logger.error('Error handling test payment:', error);
      throw error;
    }
  }

  private async createReservationFromTestData(bookingData: any): Promise<Reservation[]> {
    const createdReservations: Reservation[] = [];
    try {
      // Create reservation for each court booking
      for (const courtBooking of bookingData.courtBookings || []) {
        // Find court by name
        const courts = await this.courtsService.findAll();
        const court = courts.find(c => c.Court_Name === courtBooking.court);
        
        if (!court) {
          this.logger.error(`Court "${courtBooking.court}" not found for test reservation.`);
          continue;
        }

        const [startTime, endTime] = this.parseScheduleToTimes(courtBooking.schedule);

        const reservation = this.reservationRepository.create({
          User_ID: bookingData.userId,
          Court_ID: court.Court_Id,
          Reservation_Date: new Date(bookingData.selectedDate),
          Start_Time: startTime,
          End_Time: endTime,
          Total_Amount: courtBooking.subtotal,
          Reference_Number: bookingData.referenceNumber || `REF${Date.now()}`,
          Paymongo_Reference_Number: 'test_payment_id',
          Notes: 'Test reservation via webhook',
          Status: ReservationStatus.CONFIRMED,
        });

        await this.reservationRepository.save(reservation);
        createdReservations.push(reservation);
        this.logger.log(`Created test reservation ${reservation.Reservation_ID}`);
      }
    } catch (error) {
      this.logger.error('Error creating test reservation:', error);
      throw error;
    }
    return createdReservations;
  }

  private parseScheduleToTimes(schedule: string): [string, string] {
    // Example schedule: "8:00 AM - 9:00 AM"
    const parts = schedule.split(' - ');
    if (parts.length === 2) {
      const parseTime = (timeStr: string) => {
        const [time, ampm] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0; // Midnight
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      };
      return [parseTime(parts[0]), parseTime(parts[1])];
    }
    return ['00:00:00', '00:00:00']; // Default or error case
  }

  private mapPaymentMethod(paymongoType: string): PaymentMethod {
    switch (paymongoType?.toLowerCase()) {
      case 'gcash':
        return PaymentMethod.GCASH;
      case 'paymaya':
        return PaymentMethod.MAYA;
      case 'grab_pay':
        return PaymentMethod.GRABPAY;
      case 'card':
        return PaymentMethod.BANKING;
      default:
        return PaymentMethod.GCASH; // Default fallback
    }
  }
}
