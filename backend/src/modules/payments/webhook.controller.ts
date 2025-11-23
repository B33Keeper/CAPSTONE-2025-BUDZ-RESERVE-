import { Controller, Post, Get, Body, Headers, Logger, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PayMongoService } from './paymongo.service';
import { EmailReceiptService } from './email-receipt.service';
import { PaymentsService } from './payments.service';
import { Payment, PaymentMethod, PaymentStatus } from './entities/payment.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { CourtsService } from '../courts/courts.service';
import { ReservationsService } from '../reservations/reservations.service';

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
    private readonly reservationsService: ReservationsService,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(EquipmentRental)
    private readonly rentalRepository: Repository<EquipmentRental>,
    @InjectRepository(EquipmentRentalItem)
    private readonly rentalItemRepository: Repository<EquipmentRentalItem>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
  ) {}

  @Get('paymongo')
  @HttpCode(HttpStatus.OK)
  async getWebhookStatus() {
    const hasSecret = !!process.env.PAYMONGO_WEBHOOK_SECRET;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const apiPrefix = process.env.API_PREFIX || 'api';
    const port = process.env.PORT || 3001;
    const baseUrl = process.env.FRONTEND_URL || `http://localhost:${port}`;
    
    return {
      status: 'active',
      message: 'PayMongo webhook endpoint is active. This endpoint accepts POST requests from PayMongo.',
      endpoint: `/${apiPrefix}/webhook/paymongo`,
      method: 'POST',
      configuration: {
        webhookSecretConfigured: hasSecret,
        environment: process.env.NODE_ENV || 'development',
        signatureVerification: hasSecret ? 'enabled' : (isDevelopment ? 'disabled (dev mode)' : 'required'),
        baseUrl: baseUrl,
        fullWebhookUrl: `${baseUrl}/${apiPrefix}/webhook/paymongo`,
      },
      instructions: {
        setup: 'Configure this URL in your PayMongo dashboard under Webhooks',
        testMode: 'For test mode, use: https://api.paymongo.com/v1/webhooks',
        liveMode: 'For live mode, use: https://api.paymongo.com/v1/webhooks',
        events: ['payment.paid', 'checkout_session.payment.paid', 'payment.failed'],
        secret: hasSecret 
          ? 'Webhook secret is configured ✅' 
          : '⚠️ Set PAYMONGO_WEBHOOK_SECRET in your environment variables',
      },
    };
  }

  @Post('paymongo')
  @HttpCode(HttpStatus.OK)
  async handlePaymongoWebhook(
    @Body() body: PaymongoWebhookEvent,
    @Headers('paymongo-signature') signature: string | string[],
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    try {
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('🔔 PayMongo Webhook Received');
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log(`📋 Request URL: ${req.originalUrl}`);
      this.logger.log(`📋 Request Method: ${req.method}`);
      this.logger.log(`📋 Has rawBody: ${!!req.rawBody}`);
      this.logger.log(`📋 rawBody length: ${req.rawBody?.length || 0}`);
      this.logger.log(`📋 Has signature header: ${!!signature}`);
      this.logger.log(`📋 Signature: ${signature ? (Array.isArray(signature) ? signature[0] : signature).substring(0, 50) + '...' : 'NONE'}`);
      this.logger.log(`📋 Has PAYMONGO_WEBHOOK_SECRET: ${!!process.env.PAYMONGO_WEBHOOK_SECRET}`);
      this.logger.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Log webhook configuration status
      if (!process.env.PAYMONGO_WEBHOOK_SECRET) {
        this.logger.warn('⚠️  PAYMONGO_WEBHOOK_SECRET is not configured!');
        this.logger.warn('   Webhook signature verification will be skipped in development mode.');
        this.logger.warn('   For production, you MUST configure PAYMONGO_WEBHOOK_SECRET!');
      }

      // Verify webhook signature
      // In development, allow webhooks even if signature verification fails
      const isDevelopment = process.env.NODE_ENV === 'development';
      const hasSecret = !!process.env.PAYMONGO_WEBHOOK_SECRET;
      
      if (hasSecret) {
        // If secret is configured, try to verify signature
        const signatureValid = this.verifyWebhookSignature(req.rawBody, signature);
        if (!signatureValid) {
          if (isDevelopment) {
            // In development, allow webhooks even with invalid signature (for testing)
            this.logger.warn('⚠️ Invalid webhook signature - allowing in DEV MODE');
          } else {
            // In production, reject invalid signatures
            this.logger.warn('⚠️ Invalid webhook signature - REJECTED');
            return { success: false, message: 'Invalid signature' };
          }
        } else {
          this.logger.log('✅ Webhook signature verified successfully');
        }
      } else if (!isDevelopment) {
        // In production, require secret
        this.logger.error('❌ PAYMONGO_WEBHOOK_SECRET is required in production');
        return { success: false, message: 'Webhook secret not configured' };
      } else {
        // In development without secret, log warning but allow
        this.logger.warn('⚠️ PAYMONGO_WEBHOOK_SECRET not configured - skipping signature verification (DEV MODE)');
      }

      const { data } = body;
      const eventType = data.attributes.type;
      const paymentData = data.attributes.data;
      
      this.logger.log(`📥 Event Type: ${eventType}`);
      this.logger.log(`🆔 Event ID: ${data.id}`);

      switch (eventType) {
        case 'payment.paid':
          this.logger.log('✅ Processing payment.paid event...');
          await this.handlePaymentPaid(paymentData);
          this.logger.log('✅ Payment processed successfully!');
          break;
        case 'checkout_session.payment.paid':
          this.logger.log('✅ Processing checkout_session.payment.paid event...');
          // Prefer using the checkout session payload embedded in the webhook to avoid API fetch/mode issues
          if (paymentData && paymentData.type === 'checkout_session' && paymentData.attributes) {
            const csAttr: any = paymentData.attributes;
            let bookingDataFromSession: any | undefined;
            try {
              if (csAttr.metadata?.bookingData) {
                bookingDataFromSession = JSON.parse(csAttr.metadata.bookingData);
                this.logger.log(`📋 Booking data found in checkout session metadata`);
                this.logger.log(`👤 User ID: ${bookingDataFromSession?.userId}`);
                this.logger.log(`📅 Date: ${bookingDataFromSession?.selectedDate}`);
                this.logger.log(`🏸 Courts: ${bookingDataFromSession?.courtBookings?.length || 0}`);
              }
            } catch (e) {
              this.logger.warn('⚠️ Could not parse booking data from checkout session');
            }

            // Extract payment id from relationships
            let paymentId: string | undefined;
            const paymentsRel = csAttr.payments?.data ?? csAttr.payments ?? [];
            if (Array.isArray(paymentsRel) && paymentsRel.length > 0) {
              paymentId = paymentsRel[0]?.id;
            }
            if (!paymentId && csAttr.payment_intent?.id) {
              // Fall back to API if necessary
              this.logger.log('📞 Fetching checkout session from PayMongo API...');
              await this.handleCheckoutSessionPaid(data.id);
              break;
            }
            if (paymentId) {
              this.logger.log(`💳 Payment ID: ${paymentId}`);
              await this.handlePaymentPaid({ id: paymentId }, bookingDataFromSession);
              break;
            }
          }
          // Fallback to fetching by id
          this.logger.log('📞 Fetching checkout session from PayMongo API (fallback)...');
          await this.handleCheckoutSessionPaid(data.id);
          break;
        case 'payment.failed':
          this.logger.warn('❌ Payment failed event received');
          await this.handlePaymentFailed(paymentData);
          break;
        case 'payment_intent.succeeded':
          this.logger.log('✅ Payment intent succeeded');
          await this.handlePaymentIntentSucceeded(paymentData);
          break;
        case 'payment_intent.failed':
          this.logger.warn('❌ Payment intent failed');
          await this.handlePaymentIntentFailed(paymentData);
          break;
        default:
          this.logger.log(`⚠️ Unhandled webhook event type: ${eventType}`);
      }

      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('✅ Webhook processed successfully');
      this.logger.log('═══════════════════════════════════════════════════════════');
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  private async handleCheckoutSessionPaid(checkoutSessionId: string) {
    try {
      this.logger.log(`Fetching checkout session ${checkoutSessionId} to resolve payment`);
      const session = await this.payMongoService.getCheckoutSession(checkoutSessionId);

      // Extract booking data from checkout session metadata (Checkout stores it here, not on payment)
      let bookingDataFromSession: any | undefined;
      try {
        const md = (session as any)?.attributes?.metadata;
        if (md && md.bookingData) {
          bookingDataFromSession = JSON.parse(md.bookingData);
        }
      } catch (e) {
        this.logger.warn(`Failed to parse bookingData from checkout session ${checkoutSessionId}`);
      }

      // Try to resolve payment id from the checkout session payload
      // Prefer payments list if present; otherwise, derive from payment_intent last payment
      let paymentId: string | undefined;
      const attributes: any = (session as any)?.attributes ?? {};

      // payments may be an array of relationships
      const payments = (attributes as any).payments?.data ?? (attributes as any).payments ?? [];
      if (Array.isArray(payments) && payments.length > 0) {
        paymentId = payments[0]?.id;
      }

      // Fallback: get from payment_intent latest payment
      if (!paymentId && attributes.payment_intent?.id) {
        try {
          const pi = await this.payMongoService.getPaymentIntent(attributes.payment_intent.id);
          const latestPaymentId = (pi as any)?.attributes?.latest_payment_id || (pi as any)?.attributes?.payments?.[0]?.id;
          if (latestPaymentId) paymentId = latestPaymentId;
        } catch (e) {
          this.logger.warn(`Could not resolve payment from payment_intent ${attributes.payment_intent?.id}`);
        }
      }

      if (!paymentId) {
        this.logger.warn(`No payment id found for checkout session ${checkoutSessionId}`);
        return;
      }

      // Reuse existing flow using the payment id, passing booking data from session if payment metadata lacks it
      await this.handlePaymentPaid({ id: paymentId }, bookingDataFromSession);
    } catch (error) {
      this.logger.error('Error handling checkout_session.payment.paid event:', error);
    }
  }

  private async handlePaymentPaid(paymentData: any, bookingDataOverride?: any) {
    try {
      this.logger.log('───────────────────────────────────────────────────────────');
      this.logger.log(`💳 Processing Payment: ${paymentData.id}`);
      this.logger.log('───────────────────────────────────────────────────────────');
      
      // Always fetch the full payment details from PayMongo API to ensure we have complete information
      // Webhook payload might not include all payment method details
      let payment: any;
      try {
        payment = await this.payMongoService.getPayment(paymentData.id);
        this.logger.log(`✅ Fetched full payment details from PayMongo API`);
      } catch (fetchError) {
        // Fallback to webhook payload if API fetch fails
        this.logger.warn(`⚠️ Failed to fetch payment from API, using webhook payload: ${fetchError.message}`);
        payment = paymentData?.attributes
          ? { id: paymentData.id, attributes: paymentData.attributes }
          : { id: paymentData.id, attributes: {} };
      }
      
      this.logger.log(`💰 Amount: ₱${(payment.attributes.amount / 100).toFixed(2)}`);
      this.logger.log(`📊 Status: ${payment.attributes.status}`);
      
      // Extract payment method type - try multiple sources
      let paymentMethodType: string | undefined;
      
      // First, try source.type (direct payment method type)
      if (payment.attributes.source?.type) {
        paymentMethodType = payment.attributes.source.type;
        this.logger.log(`💳 Payment Method (from source.type): ${paymentMethodType}`);
      }
      
      // If not found and we have a source.id (payment method ID), fetch the payment method details
      if (!paymentMethodType && payment.attributes.source?.id) {
        try {
          this.logger.log(`🔍 Fetching payment method details from source.id: ${payment.attributes.source.id}`);
          const paymentMethod = await this.payMongoService.getPaymentMethod(payment.attributes.source.id);
          paymentMethodType = paymentMethod.attributes.type;
          this.logger.log(`💳 Payment Method (from fetched payment method): ${paymentMethodType}`);
        } catch (error) {
          this.logger.warn(`⚠️ Failed to fetch payment method details: ${error.message}`);
        }
      }
      
      // If still not found, log warning and use default
      if (!paymentMethodType) {
        this.logger.warn(`⚠️ Payment method type not found in payment object, using default GCASH`);
        this.logger.log(`   Payment object structure:`, JSON.stringify({
          source: payment.attributes.source,
          id: payment.id
        }, null, 2));
        paymentMethodType = 'gcash'; // Default fallback
      }
      
      // Create reservation FIRST if booking data is in metadata or provided by caller (checkout session)
      let reservationId = 0;
      let createdReservations: Reservation[] = [];
      const bookingDataRaw = payment.attributes?.metadata?.bookingData || (bookingDataOverride ? JSON.stringify(bookingDataOverride) : undefined);
      if (bookingDataRaw) {
        try {
          const bookingData = typeof bookingDataRaw === 'string' ? JSON.parse(bookingDataRaw) : bookingDataRaw;
          this.logger.log(`📋 Creating reservations from booking data...`);
          this.logger.log(`   👤 User ID: ${bookingData.userId}`);
          this.logger.log(`   📅 Date: ${bookingData.selectedDate}`);
          this.logger.log(`   🏸 Court Bookings: ${bookingData.courtBookings?.length || 0}`);
          
          createdReservations = await this.createReservationFromPayment(payment, bookingData);
          
          // Get the first created reservation ID
          if (createdReservations.length > 0) {
            reservationId = createdReservations[0].Reservation_ID;
            this.logger.log(`✅ Successfully created ${createdReservations.length} reservation(s)`);
            this.logger.log(`   🆔 Reservation ID(s): ${createdReservations.map(r => r.Reservation_ID).join(', ')}`);
            this.logger.log(`   📝 Reference Number: ${createdReservations[0].Reference_Number}`);
          } else {
            this.logger.warn('⚠️ No reservations were created');
          }
        } catch (error) {
          this.logger.error('❌ Error creating reservation from payment metadata:', error);
          throw error;
        }
      } else {
        this.logger.warn('⚠️ No booking data found in payment metadata or override');
      }
      
      // Create payment record(s) in local database - one for each reservation in the transaction
      // This ensures all reservations in the same transaction have payment information
      const totalAmount = payment.attributes.amount / 100; // Convert from centavos
      const paymentMethod = this.mapPaymentMethod(paymentMethodType || payment.attributes.source?.type || 'gcash');
      const transactionId = payment.id;
      const referenceNumber = createdReservations.length > 0 
        ? createdReservations[0].Reference_Number 
        : `REF${Date.now()}`;
      
      if (createdReservations.length > 0) {
        // Create a payment record for each reservation
        const paymentPromises = createdReservations.map(async (reservation: Reservation) => {
          // Calculate amount per reservation (divide total by number of reservations)
          // Or use the reservation's total amount if available
          const reservationAmount = Number(reservation.Total_Amount) || (totalAmount / createdReservations.length);
          
          const newPayment = this.paymentRepository.create({
            reservation_id: reservation.Reservation_ID,
            amount: reservationAmount,
            payment_method: paymentMethod,
            transaction_id: transactionId,
            reference_number: referenceNumber,
            notes: payment.attributes.description,
            status: payment.attributes.status === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
          });
          return this.paymentRepository.save(newPayment);
        });
        
        const savedPayments = await Promise.all(paymentPromises);
        this.logger.log(`✅ Created ${savedPayments.length} payment record(s) in database`);
        savedPayments.forEach((savedPayment: Payment, index: number) => {
          this.logger.log(`   🆔 Payment Record ID: ${savedPayment.id}, Linked to Reservation ID: ${createdReservations[index].Reservation_ID}`);
        });
      } else if (reservationId > 0) {
        // Fallback: if no reservations were created but we have a reservationId, create one payment
        const newPayment = this.paymentRepository.create({
          reservation_id: reservationId,
          amount: totalAmount,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          reference_number: referenceNumber,
          notes: payment.attributes.description,
          status: payment.attributes.status === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
        });
        await this.paymentRepository.save(newPayment);
        this.logger.log(`✅ Created payment record in database`);
        this.logger.log(`   🆔 Payment Record ID: ${newPayment.id}`);
        this.logger.log(`   🔗 Linked to Reservation ID: ${reservationId}`);
      }
      
      // Persist equipment rentals if present in booking data
      // Link equipment rentals to the first reservation (or could be distributed, but typically equipment is shared across all reservations in a transaction)
      try {
        const effectiveBookingData = bookingDataOverride
          ? bookingDataOverride
          : (payment.attributes?.metadata?.bookingData ? JSON.parse(payment.attributes.metadata.bookingData) : undefined);
        if (effectiveBookingData?.equipmentBookings?.length && createdReservations.length > 0) {
          // Link equipment rentals to the first reservation in the transaction
          const firstReservationId = createdReservations[0].Reservation_ID;
          // Use the userId from the first reservation if bookingData.userId is null (admin-created)
          const effectiveUserId = createdReservations[0]?.User_ID || effectiveBookingData.userId;
          await this.createEquipmentRentalsFromBooking(
            effectiveUserId,
            firstReservationId,
            effectiveBookingData.equipmentBookings
          );
        }
      } catch (e) {
        this.logger.error('Error saving equipment rentals:', e);
      }
      
      // Send detailed receipt email
      try {
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
        this.logger.log('📧 Payment receipt email sent successfully');
      } catch (emailError) {
        this.logger.warn('⚠️ Failed to send payment receipt email:', emailError);
      }

      this.logger.log('───────────────────────────────────────────────────────────');
      this.logger.log('✅ Payment processing completed successfully!');
      this.logger.log('───────────────────────────────────────────────────────────');
    } catch (error) {
      this.logger.error('Error handling payment.paid event:', error);
    }
  }

  private parseHours(timeLabel: string): number {
    if (!timeLabel) return 1;
    const m = String(timeLabel).match(/(\d+)\s*(h|hr|hrs|hour)/i);
    if (m) return parseInt(m[1], 10);
    const m2 = String(timeLabel).match(/(\d+)/);
    return m2 ? parseInt(m2[1], 10) : 1;
  }

  private async createEquipmentRentalsFromBooking(
    userId: number,
    reservationId: number,
    equipmentBookings: Array<{ equipment: string; time: string; subtotal?: number; quantity?: number }>,
  ) {
    if (!reservationId || !userId) return;

    const rental = this.rentalRepository.create({
      reservation_id: reservationId,
      user_id: userId,
      total_amount: 0,
    });
    const savedRental = await this.rentalRepository.save(rental);

    let total = 0;
    for (const b of equipmentBookings) {
      const hours = this.parseHours(b.time);
      const quantity = b.quantity && b.quantity > 0 ? b.quantity : 1;

      let equipmentRow = await this.equipmentRepository.findOne({ where: { equipment_name: Like(`%${b.equipment}%`) } });
      if (!equipmentRow) {
        equipmentRow = await this.equipmentRepository.findOne({ where: { equipment_name: b.equipment } });
      }

      const hourlyPrice = equipmentRow ? Number(equipmentRow.price) : Number(((b.subtotal || 0) / Math.max(1, hours * quantity)).toFixed(2)) || 0;
      const subtotal = b.subtotal != null && b.subtotal > 0 ? Number(b.subtotal) : Number((hourlyPrice * hours * quantity).toFixed(2));

      const item = this.rentalItemRepository.create({
        rental_id: savedRental.id,
        equipment_id: equipmentRow ? equipmentRow.id : 0,
        quantity,
        hours,
        hourly_price: hourlyPrice,
        subtotal,
      });
      await this.rentalItemRepository.save(item);
      total += subtotal;
    }

    await this.rentalRepository.update(savedRental.id, { total_amount: Number(total.toFixed(2)) });
    this.logger.log(`Saved equipment rental ${savedRental.id} with total ₱${total}`);
  }

  private async createReservationFromPayment(payment: any, bookingData: any): Promise<Reservation[]> {
    const createdReservations: Reservation[] = [];
    try {
      // If userId is null/undefined and we have customer info, create/get guest user for admin-created reservations
      let effectiveUserId = bookingData.userId;
      if ((!effectiveUserId || effectiveUserId === null) && (bookingData.customerName || bookingData.customerEmail || bookingData.customerContact)) {
        this.logger.log(`   👤 Admin-created reservation detected. Creating/getting guest user...`);
        try {
          const guestUser = await this.reservationsService.getOrCreateGuestUser(
            bookingData.customerName || 'Walk-in Customer',
            bookingData.customerEmail,
            bookingData.customerContact
          );
          effectiveUserId = guestUser.id;
          this.logger.log(`   ✅ Guest user created/found: User ID ${effectiveUserId}`);
        } catch (userError) {
          this.logger.error(`   ❌ Failed to create/get guest user: ${userError.message}`);
          throw new Error(`Failed to create guest user for admin-created reservation: ${userError.message}`);
        }
      }
      
      // Create reservations from booking data in payment metadata
      for (const courtBooking of bookingData.courtBookings || []) {
        // Map court name to Court_ID
        const courts = await this.courtsService.findAll();
        const court = courts.find(c => c.Court_Name === courtBooking.court);
        if (!court) {
          this.logger.error(`Court "${courtBooking.court}" not found for reservation.`);
          continue;
        }

        const [startTime, endTime] = this.parseScheduleToTimes(courtBooking.schedule);

        // Parse and normalize the date to ensure consistent format
        const reservationDate = new Date(bookingData.selectedDate);
        reservationDate.setHours(0, 0, 0, 0);
        
        this.logger.log(`   📅 Creating reservation for date: ${reservationDate.toISOString().split('T')[0]}`);
        this.logger.log(`   ⏰ Time: ${startTime} - ${endTime}`);
        this.logger.log(`   🏸 Court: ${court.Court_Name} (ID: ${court.Court_Id})`);
        this.logger.log(`   👤 User ID: ${effectiveUserId}`);
        
        // Check for duplicate reservation to prevent webhook from creating duplicates
        const existingReservation = await this.reservationRepository.findOne({
          where: {
            User_ID: effectiveUserId,
            Court_ID: court.Court_Id,
            Reservation_Date: reservationDate,
            Start_Time: startTime,
            End_Time: endTime,
            Paymongo_Reference_Number: payment.id,
            Status: ReservationStatus.CONFIRMED,
          },
        });
        
        if (existingReservation) {
          this.logger.warn(`⚠️ Duplicate reservation detected - skipping creation. Existing Reservation ID: ${existingReservation.Reservation_ID}`);
          createdReservations.push(existingReservation);
          continue;
        }
        
        // Calculate the individual court price for this reservation
        // Priority: 1. courtBooking.subtotal (from frontend), 2. court.Price (from database), 3. fallback to payment amount divided by number of courts
        let individualPrice = 0;
        if (courtBooking.subtotal && Number(courtBooking.subtotal) > 0) {
          individualPrice = Number(courtBooking.subtotal);
          this.logger.log(`   💰 Using courtBooking.subtotal: ${individualPrice}`);
        } else if (court.Price && Number(court.Price) > 0) {
          individualPrice = Number(court.Price);
          this.logger.log(`   💰 Using court.Price: ${individualPrice}`);
        } else {
          // Last resort: divide total payment by number of court bookings (not ideal but better than total)
          const totalCourtBookings = bookingData.courtBookings?.length || 1;
          individualPrice = (payment.attributes.amount / 100) / totalCourtBookings;
          this.logger.warn(`   ⚠️ No subtotal or court price found, dividing payment amount ${payment.attributes.amount / 100} by ${totalCourtBookings} courts: ${individualPrice}`);
        }
        
        const reservation = this.reservationRepository.create({
          User_ID: effectiveUserId,
          Court_ID: court.Court_Id,
          Reservation_Date: reservationDate,
          Start_Time: startTime,
          End_Time: endTime,
          Total_Amount: individualPrice, // Use the calculated individual price per court
          Reference_Number: bookingData.referenceNumber || `REF${Date.now()}`,
          Paymongo_Reference_Number: payment.id,
          Notes: `Payment via Paymongo - ${payment.id}`,
          Status: ReservationStatus.CONFIRMED,
          Is_Admin_Created: bookingData.isAdminCreated === true, // Check if this is an admin-created reservation
        });

        const savedReservation = await this.reservationRepository.save(reservation);
        createdReservations.push(savedReservation);
        this.logger.log(`✅ Created reservation ${savedReservation.Reservation_ID}`);
        this.logger.log(`   📋 Details: Date=${savedReservation.Reservation_Date}, Status=${savedReservation.Status}, Is_Admin_Created=${savedReservation.Is_Admin_Created}`);
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

  private verifyWebhookSignature(rawBody: Buffer | undefined, signature: string | string[] | undefined): boolean {
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('PAYMONGO_WEBHOOK_SECRET is not configured');
      return false;
    }

    if (!signature) {
      this.logger.warn('Missing paymongo-signature header');
      return false;
    }

    try {
      if (!rawBody || rawBody.length === 0) {
        this.logger.warn('Missing raw request body for signature verification');
        return false;
      }

      const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
      if (!signatureHeader || typeof signatureHeader !== 'string') {
        this.logger.warn(`Invalid signature header format: ${JSON.stringify(signature)}`);
        return false;
      }

      const signatureParts = signatureHeader
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((acc, part) => {
          const [key, value] = part.split('=');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {});

      const timestamp = signatureParts['t'];
      const expectedSignature =
        signatureParts['v1'] ||
        signatureParts['te'] ||
        signatureParts['li'];

      if (!timestamp || !expectedSignature) {
        this.logger.warn(`Invalid signature header format: ${signatureHeader}`);
        return false;
      }

      const payload = `${timestamp}.${rawBody.toString('utf8')}`;
      const hmac = createHmac('sha256', secret);
      hmac.update(payload, 'utf8');
      const computedSignature = hmac.digest('hex');

      const computedBuffer = Buffer.from(computedSignature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (
        computedBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(computedBuffer, expectedBuffer)
      ) {
        this.logger.warn('Webhook signature validation failed');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  private parseScheduleToTimes(schedule: string): [string, string] {
    // Example schedule: "8:00 AM - 9:00 AM" or "1:00 PM - 2:00 PM"
    const parts = schedule.split(' - ');
    if (parts.length === 2) {
      const parseTime = (timeStr: string) => {
        const trimmed = timeStr.trim();
        // Handle both "1:00 PM" and "1:00PM" formats
        const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!timeMatch) {
          this.logger.warn(`Failed to parse time: ${timeStr}`);
          return '00:00:00';
        }
        
        const [, hourStr, minStr, period] = timeMatch;
        let hours = parseInt(hourStr, 10);
        const minutes = parseInt(minStr, 10);
        const periodUpper = period.toUpperCase();
        
        // Convert to 24-hour format
        if (periodUpper === 'PM' && hours !== 12) {
          hours += 12;
        } else if (periodUpper === 'AM' && hours === 12) {
          hours = 0; // Midnight
        }
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      };
      const startTime = parseTime(parts[0]);
      const endTime = parseTime(parts[1]);
      this.logger.log(`   ⏰ Parsed schedule "${schedule}" → ${startTime} - ${endTime}`);
      return [startTime, endTime];
    }
    this.logger.warn(`Invalid schedule format: ${schedule}`);
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
      case 'cash':
        return PaymentMethod.CASH;
      default:
        return PaymentMethod.GCASH; // Default fallback
    }
  }
}
