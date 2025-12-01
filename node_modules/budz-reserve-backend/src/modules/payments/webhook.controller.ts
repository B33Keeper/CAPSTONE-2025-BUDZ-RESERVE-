import { Controller, Post, Get, Body, Headers, Logger, HttpCode, HttpStatus, Req, UsePipes } from '@nestjs/common';
import { WebhookValidationPipe } from '../../pipes/webhook-validation.pipe';
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
    @InjectRepository(EquipmentRental)
    private readonly rentalRepository: Repository<EquipmentRental>,
    @InjectRepository(EquipmentRentalItem)
    private readonly rentalItemRepository: Repository<EquipmentRentalItem>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
  ) {}

  @Get('paymongo/test')
  @HttpCode(HttpStatus.OK)
  async testWebhookEndpoint(@Req() req: Request) {
    this.logger.log('🧪 Test webhook endpoint called');
    return {
      success: true,
      message: 'Webhook endpoint is reachable!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      headers: {
        host: req.get('host'),
        'user-agent': req.get('user-agent'),
      },
    };
  }

  @Get('paymongo')
  @HttpCode(HttpStatus.OK)
  async getWebhookStatus(@Req() req: Request) {
    const hasSecret = !!process.env.PAYMONGO_WEBHOOK_SECRET;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const apiPrefix = process.env.API_PREFIX || 'api';
    
    // Try to get backend URL from various sources (priority order):
    // 1. RAILWAY_PUBLIC_DOMAIN (Railway provides this)
    // 2. BACKEND_URL (custom env var)
    // 3. Construct from request host (if available)
    // 4. Fallback to localhost
    let baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : process.env.BACKEND_URL;
    
    if (!baseUrl) {
      // Try to construct from request
      const protocol = req.protocol || 'https';
      const host = req.get('host') || req.headers.host;
      if (host) {
        baseUrl = `${protocol}://${host}`;
      } else {
        const port = process.env.PORT || 3001;
        baseUrl = `http://localhost:${port}`;
      }
    }
    
    const fullWebhookUrl = `${baseUrl}/${apiPrefix}/webhook/paymongo`;
    
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
        fullWebhookUrl: fullWebhookUrl,
      },
      instructions: {
        setup: 'Configure this URL in your PayMongo dashboard under Webhooks',
        webhookUrl: fullWebhookUrl,
        testMode: 'For test mode, use: https://api.paymongo.com/v1/webhooks',
        liveMode: 'For live mode, use: https://api.paymongo.com/v1/webhooks',
        events: ['payment.paid', 'checkout_session.payment.paid', 'payment.failed'],
        secret: hasSecret 
          ? 'Webhook secret is configured ✅' 
          : '⚠️ Set PAYMONGO_WEBHOOK_SECRET in your environment variables',
        important: '⚠️ IMPORTANT: Copy the webhookUrl above and configure it in your PayMongo dashboard. Without this, transactions will not be recorded in the database.',
      },
    };
  }

  @Post('paymongo')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new WebhookValidationPipe()) // Skip validation for webhook - Paymongo sends its own structure
  async handlePaymongoWebhook(
    @Body() body: any, // Use 'any' to bypass ValidationPipe - Paymongo sends its own structure
    @Headers('paymongo-signature') signature: string | string[],
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    try {
      // Log the full request body for debugging - USE CONSOLE.LOG FOR RAILWAY VISIBILITY
      const logMsg = '═══════════════════════════════════════════════════════════\n🔔 PayMongo Webhook Received\n═══════════════════════════════════════════════════════════';
      console.log(logMsg);
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('🔔 PayMongo Webhook Received');
      this.logger.log('═══════════════════════════════════════════════════════════');
      
      const requestInfo = `📋 Request URL: ${req.originalUrl}\n📋 Request Method: ${req.method}\n📋 Request Host: ${req.get('host') || req.headers.host || 'unknown'}\n📋 Has rawBody: ${!!req.rawBody}\n📋 rawBody length: ${req.rawBody?.length || 0}\n📋 Has signature header: ${!!signature}\n📋 Signature: ${signature ? (Array.isArray(signature) ? signature[0] : signature).substring(0, 50) + '...' : 'NONE'}\n📋 Has PAYMONGO_WEBHOOK_SECRET: ${!!process.env.PAYMONGO_WEBHOOK_SECRET}\n📋 Environment: ${process.env.NODE_ENV || 'development'}\n📋 Railway Public Domain: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'not set'}`;
      console.log(requestInfo);
      this.logger.log(`📋 Request URL: ${req.originalUrl}`);
      this.logger.log(`📋 Request Method: ${req.method}`);
      this.logger.log(`📋 Request Host: ${req.get('host') || req.headers.host || 'unknown'}`);
      this.logger.log(`📋 Has rawBody: ${!!req.rawBody}`);
      this.logger.log(`📋 rawBody length: ${req.rawBody?.length || 0}`);
      this.logger.log(`📋 Has signature header: ${!!signature}`);
      this.logger.log(`📋 Signature: ${signature ? (Array.isArray(signature) ? signature[0] : signature).substring(0, 50) + '...' : 'NONE'}`);
      this.logger.log(`📋 Has PAYMONGO_WEBHOOK_SECRET: ${!!process.env.PAYMONGO_WEBHOOK_SECRET}`);
      this.logger.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      this.logger.log(`📋 Railway Public Domain: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'not set'}`);
      
      const bodyStr = JSON.stringify(body, null, 2);
      console.log(`📦 Full webhook body: ${bodyStr}`);
      this.logger.log(`📦 Full webhook body: ${bodyStr}`);
      
      // Log webhook configuration status
      if (!process.env.PAYMONGO_WEBHOOK_SECRET) {
        console.warn('⚠️  PAYMONGO_WEBHOOK_SECRET is not configured!');
        console.warn('   Webhook signature verification will be skipped in development mode.');
        console.warn('   For production, you MUST configure PAYMONGO_WEBHOOK_SECRET!');
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
      
      console.log(`📥 Event Type: ${eventType}`);
      console.log(`🆔 Event ID: ${data.id}`);
      this.logger.log(`📥 Event Type: ${eventType}`);
      this.logger.log(`🆔 Event ID: ${data.id}`);
      this.logger.log(`📦 Full webhook payload structure:`);
      this.logger.log(`   data.id: ${data.id}`);
      this.logger.log(`   data.attributes.type: ${data.attributes.type}`);
      this.logger.log(`   data.attributes.data.type: ${paymentData?.type || 'N/A'}`);
      this.logger.log(`   data.attributes.data.id: ${paymentData?.id || 'N/A'}`);
      if (paymentData?.attributes) {
        const attrKeys = Object.keys(paymentData.attributes).join(', ');
        console.log(`   data.attributes.data.attributes keys: ${attrKeys}`);
        this.logger.log(`   data.attributes.data.attributes keys: ${attrKeys}`);
      }

      switch (eventType) {
        case 'payment.paid':
          console.log('✅ Processing payment.paid event...');
          this.logger.log('✅ Processing payment.paid event...');
          await this.handlePaymentPaid(paymentData);
          console.log('✅ Payment processed successfully!');
          this.logger.log('✅ Payment processed successfully!');
          break;
        case 'checkout_session.payment.paid':
          console.log('✅ Processing checkout_session.payment.paid event...');
          console.log(`📋 Checkout Session ID from webhook: ${data.id}`);
          this.logger.log('✅ Processing checkout_session.payment.paid event...');
          this.logger.log(`📋 Checkout Session ID from webhook: ${data.id}`);
          const paymentDataStr = JSON.stringify(paymentData, null, 2);
          console.log(`📦 Full paymentData structure: ${paymentDataStr}`);
          this.logger.log(`📦 Full paymentData structure: ${paymentDataStr}`);
          
          // Prefer using the checkout session payload embedded in the webhook to avoid API fetch/mode issues
          if (paymentData && paymentData.type === 'checkout_session' && paymentData.attributes) {
            const csAttr: any = paymentData.attributes;
            console.log(`📋 Checkout session attributes found in webhook payload`);
            const csMetadataStr = JSON.stringify(csAttr.metadata || {});
            console.log(`📋 Checkout session metadata: ${csMetadataStr}`);
            this.logger.log(`📋 Checkout session attributes found in webhook payload`);
            this.logger.log(`📋 Checkout session metadata: ${csMetadataStr}`);
            
            let bookingDataFromSession: any | undefined;
            try {
              if (csAttr.metadata?.bookingData) {
                bookingDataFromSession = JSON.parse(csAttr.metadata.bookingData);
                console.log(`✅ Booking data found in checkout session metadata from webhook payload`);
                console.log(`   👤 User ID: ${bookingDataFromSession?.userId}`);
                console.log(`   📅 Date: ${bookingDataFromSession?.selectedDate}`);
                console.log(`   🏸 Courts: ${bookingDataFromSession?.courtBookings?.length || 0}`);
                console.log(`   🎾 Equipment: ${bookingDataFromSession?.equipmentBookings?.length || 0}`);
                this.logger.log(`✅ Booking data found in checkout session metadata from webhook payload`);
                this.logger.log(`   👤 User ID: ${bookingDataFromSession?.userId}`);
                this.logger.log(`   📅 Date: ${bookingDataFromSession?.selectedDate}`);
                this.logger.log(`   🏸 Courts: ${bookingDataFromSession?.courtBookings?.length || 0}`);
                this.logger.log(`   🎾 Equipment: ${bookingDataFromSession?.equipmentBookings?.length || 0}`);
              } else {
                const mdKeys = csAttr.metadata ? Object.keys(csAttr.metadata).join(', ') : 'no metadata';
                console.warn('⚠️ No bookingData found in checkout session metadata from webhook payload');
                console.warn(`   Metadata keys: ${mdKeys}`);
                console.warn(`   Will fetch from API as fallback...`);
                this.logger.warn('⚠️ No bookingData found in checkout session metadata from webhook payload');
                this.logger.warn(`   Metadata keys: ${mdKeys}`);
                this.logger.warn(`   Will fetch from API as fallback...`);
              }
            } catch (e) {
              const errorMsg = `❌ Error parsing booking data from checkout session: ${e.message}`;
              const rawMetadata = JSON.stringify(csAttr.metadata);
              console.error(errorMsg);
              console.error(`   Raw metadata: ${rawMetadata}`);
              this.logger.error(errorMsg);
              this.logger.error(`   Raw metadata: ${rawMetadata}`);
            }

            // Extract payment id from relationships
            let paymentId: string | undefined;
            const paymentsRel = csAttr.payments?.data ?? csAttr.payments ?? [];
            if (Array.isArray(paymentsRel) && paymentsRel.length > 0) {
              paymentId = paymentsRel[0]?.id;
              console.log(`💳 Payment ID from webhook payload: ${paymentId}`);
              this.logger.log(`💳 Payment ID from webhook payload: ${paymentId}`);
            }
            if (!paymentId && csAttr.payment_intent?.id) {
              // Fall back to API if necessary
              console.log('📞 Payment ID not in payload, fetching checkout session from PayMongo API...');
              this.logger.log('📞 Payment ID not in payload, fetching checkout session from PayMongo API...');
              await this.handleCheckoutSessionPaid(data.id);
              break;
            }
            if (paymentId) {
              console.log(`💳 Processing payment with ID: ${paymentId}`);
              this.logger.log(`💳 Processing payment with ID: ${paymentId}`);
              await this.handlePaymentPaid({ id: paymentId }, bookingDataFromSession);
              break;
            } else {
              console.warn('⚠️ No payment ID found in webhook payload, falling back to API fetch');
              this.logger.warn('⚠️ No payment ID found in webhook payload, falling back to API fetch');
            }
          } else {
            console.warn('⚠️ Checkout session data not in webhook payload, fetching from API...');
            this.logger.warn('⚠️ Checkout session data not in webhook payload, fetching from API...');
          }
          // Fallback to fetching by id
          console.log('📞 Fetching checkout session from PayMongo API (fallback)...');
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

      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ Webhook processed successfully');
      console.log('═══════════════════════════════════════════════════════════');
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('✅ Webhook processed successfully');
      this.logger.log('═══════════════════════════════════════════════════════════');
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      const errorMsg = `═══════════════════════════════════════════════════════════\n❌ Error processing webhook\n═══════════════════════════════════════════════════════════\nError message: ${error.message}\nError stack: ${error.stack}`;
      console.error(errorMsg);
      this.logger.error('═══════════════════════════════════════════════════════════');
      this.logger.error('❌ Error processing webhook');
      this.logger.error('═══════════════════════════════════════════════════════════');
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        this.logger.error(`Error name: ${error.name}`);
      }
      return { success: false, message: `Webhook processing failed: ${error.message}` };
    }
  }

  private async handleCheckoutSessionPaid(checkoutSessionId: string) {
    try {
      console.log(`📞 Fetching checkout session ${checkoutSessionId} to resolve payment`);
      this.logger.log(`📞 Fetching checkout session ${checkoutSessionId} to resolve payment`);
      const session = await this.payMongoService.getCheckoutSession(checkoutSessionId);
      console.log(`✅ Checkout session fetched successfully`);
      this.logger.log(`✅ Checkout session fetched successfully`);

      // Extract booking data from checkout session metadata (Checkout stores it here, not on payment)
      let bookingDataFromSession: any | undefined;
      try {
        const md = (session as any)?.attributes?.metadata;
        const mdStr = JSON.stringify(md || {});
        console.log(`📋 Checkout session metadata: ${mdStr}`);
        this.logger.log(`📋 Checkout session metadata: ${mdStr}`);
        if (md && md.bookingData) {
          bookingDataFromSession = JSON.parse(md.bookingData);
          console.log(`✅ Booking data extracted from checkout session`);
          console.log(`   👤 User ID: ${bookingDataFromSession?.userId}`);
          console.log(`   📅 Date: ${bookingDataFromSession?.selectedDate}`);
          console.log(`   🏸 Courts: ${bookingDataFromSession?.courtBookings?.length || 0}`);
          console.log(`   🎾 Equipment: ${bookingDataFromSession?.equipmentBookings?.length || 0}`);
          this.logger.log(`✅ Booking data extracted from checkout session`);
          this.logger.log(`   👤 User ID: ${bookingDataFromSession?.userId}`);
          this.logger.log(`   📅 Date: ${bookingDataFromSession?.selectedDate}`);
          this.logger.log(`   🏸 Courts: ${bookingDataFromSession?.courtBookings?.length || 0}`);
          this.logger.log(`   🎾 Equipment: ${bookingDataFromSession?.equipmentBookings?.length || 0}`);
        } else {
          const mdKeys = md ? Object.keys(md).join(', ') : 'no metadata';
          console.error(`❌ No bookingData found in checkout session metadata!`);
          console.error(`   Metadata keys: ${mdKeys}`);
          this.logger.error(`❌ No bookingData found in checkout session metadata!`);
          this.logger.error(`   Metadata keys: ${mdKeys}`);
        }
      } catch (e) {
        console.error(`❌ Failed to parse bookingData from checkout session ${checkoutSessionId}: ${e.message}`);
        console.error(`   Error stack: ${e.stack}`);
        this.logger.error(`❌ Failed to parse bookingData from checkout session ${checkoutSessionId}: ${e.message}`);
        this.logger.error(`   Error stack: ${e.stack}`);
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
      console.error('❌ Error handling checkout_session.payment.paid event:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      this.logger.error('Error handling checkout_session.payment.paid event:', error);
    }
  }

  private async handlePaymentPaid(paymentData: any, bookingDataOverride?: any) {
    try {
      console.log('───────────────────────────────────────────────────────────');
      console.log(`💳 Processing Payment: ${paymentData.id}`);
      console.log('───────────────────────────────────────────────────────────');
      this.logger.log('───────────────────────────────────────────────────────────');
      this.logger.log(`💳 Processing Payment: ${paymentData.id}`);
      this.logger.log('───────────────────────────────────────────────────────────');
      
      // Prefer payment details from webhook payload; fallback to API fetch
      const payment = paymentData?.attributes
        ? { id: paymentData.id, attributes: paymentData.attributes }
        : await this.payMongoService.getPayment(paymentData.id);
      
      const amount = (payment.attributes.amount / 100).toFixed(2);
      const paymentMethodType = payment.attributes.source?.type || 'Unknown';
      const status = payment.attributes.status;
      console.log(`💰 Amount: ₱${amount}`);
      console.log(`💳 Payment Method: ${paymentMethodType}`);
      console.log(`📊 Status: ${status}`);
      this.logger.log(`💰 Amount: ₱${amount}`);
      this.logger.log(`💳 Payment Method: ${paymentMethodType}`);
      this.logger.log(`📊 Status: ${status}`);
      
      // CRITICAL: Idempotency check - prevent duplicate processing if webhook is called multiple times
      const transactionId = payment.id; // PayMongo payment ID is the transaction ID
      const existingPayment = await this.paymentRepository.findOne({
        where: { transaction_id: transactionId },
      });
      
      if (existingPayment) {
        // This is expected behavior - PayMongo may send the same webhook multiple times
        // The system correctly prevents duplicate processing
        const dupMsg = `✅ Duplicate webhook detected and safely ignored: Payment ${transactionId} was already processed. Existing payment ID: ${existingPayment.id}, Reservation ID: ${existingPayment.reservation_id}. This is normal - PayMongo may send webhooks multiple times. System prevented duplicate processing.`;
        console.log(dupMsg);
        this.logger.log(dupMsg);
        return; // Exit early - payment already processed
      }
      
      // Create reservation FIRST if booking data is in metadata or provided by caller (checkout session)
      let reservationId = 0;
      let createdReservations: Reservation[] = [];
      const bookingDataRaw = payment.attributes?.metadata?.bookingData || (bookingDataOverride ? JSON.stringify(bookingDataOverride) : undefined);
      if (bookingDataRaw) {
        try {
          const bookingData = typeof bookingDataRaw === 'string' ? JSON.parse(bookingDataRaw) : bookingDataRaw;
          console.log(`📋 Creating reservations from booking data...`);
          console.log(`   👤 User ID: ${bookingData.userId}`);
          console.log(`   📅 Date: ${bookingData.selectedDate}`);
          console.log(`   🏸 Court Bookings: ${bookingData.courtBookings?.length || 0}`);
          this.logger.log(`📋 Creating reservations from booking data...`);
          this.logger.log(`   👤 User ID: ${bookingData.userId}`);
          this.logger.log(`   📅 Date: ${bookingData.selectedDate}`);
          this.logger.log(`   🏸 Court Bookings: ${bookingData.courtBookings?.length || 0}`);
          
          createdReservations = await this.createReservationFromPayment(payment, bookingData);
          
          // Get the first created reservation ID
          if (createdReservations.length > 0) {
            reservationId = createdReservations[0].Reservation_ID;
            const resIds = createdReservations.map(r => r.Reservation_ID).join(', ');
            console.log(`✅ Successfully created ${createdReservations.length} reservation(s)`);
            console.log(`   🆔 Reservation ID(s): ${resIds}`);
            console.log(`   📝 Reference Number: ${createdReservations[0].Reference_Number}`);
            this.logger.log(`✅ Successfully created ${createdReservations.length} reservation(s)`);
            this.logger.log(`   🆔 Reservation ID(s): ${resIds}`);
            this.logger.log(`   📝 Reference Number: ${createdReservations[0].Reference_Number}`);
          } else {
            console.warn('⚠️ No reservations were created');
            this.logger.warn('⚠️ No reservations were created');
          }
        } catch (error) {
          console.error('❌ Error creating reservation from payment metadata:', error);
          console.error('Error details:', error.message, error.stack);
          this.logger.error('❌ Error creating reservation from payment metadata:', error);
          throw error;
        }
      } else {
        const noBookingMsg = '⚠️ No booking data found in payment metadata or override';
        const metadataStr = JSON.stringify(payment.attributes?.metadata || {});
        console.warn(noBookingMsg);
        console.warn(`   Payment metadata: ${metadataStr}`);
        console.warn(`   Booking data override: ${bookingDataOverride ? 'provided' : 'not provided'}`);
        console.error('❌ Cannot create reservations without booking data. Transaction will not be recorded.');
        this.logger.warn('⚠️ No booking data found in payment metadata or override');
        this.logger.warn(`   Payment metadata: ${metadataStr}`);
        this.logger.warn(`   Booking data override: ${bookingDataOverride ? 'provided' : 'not provided'}`);
        this.logger.error('❌ Cannot create reservations without booking data. Transaction will not be recorded.');
        // Don't create payment record if no reservations were created
        return;
      }
      
      // Create payment record(s) in local database - one for each reservation in the transaction
      // This ensures all reservations in the same transaction have payment information
      const totalAmount = payment.attributes.amount / 100; // Convert from centavos
      const paymentMethod = this.mapPaymentMethod(payment.attributes.source?.type);
      // transactionId is already declared above for idempotency check
      const referenceNumber = createdReservations.length > 0 
        ? createdReservations[0].Reference_Number 
        : `REF${Date.now()}`;
      
      if (createdReservations.length > 0) {
        // Create a payment record for each reservation
        try {
          console.log(`💾 Attempting to create ${createdReservations.length} payment record(s) in database...`);
          this.logger.log(`💾 Attempting to create ${createdReservations.length} payment record(s) in database...`);
          
          const paymentPromises = createdReservations.map(async (reservation: Reservation) => {
            // Calculate amount per reservation (divide total by number of reservations)
            // Or use the reservation's total amount if available
            const reservationAmount = Number(reservation.Total_Amount) || (totalAmount / createdReservations.length);
            
            console.log(`   💰 Creating payment for Reservation ID: ${reservation.Reservation_ID}, Amount: ₱${reservationAmount}, Transaction ID: ${transactionId}`);
            this.logger.log(`   💰 Creating payment for Reservation ID: ${reservation.Reservation_ID}, Amount: ₱${reservationAmount}, Transaction ID: ${transactionId}`);
            
            const newPayment = this.paymentRepository.create({
              reservation_id: reservation.Reservation_ID,
              amount: reservationAmount,
              payment_method: paymentMethod,
              transaction_id: transactionId,
              reference_number: referenceNumber,
              notes: payment.attributes.description,
              status: payment.attributes.status === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
            });
            
            const savedPayment = await this.paymentRepository.save(newPayment);
            console.log(`   ✅ Payment record created successfully: ID=${savedPayment.id}, Reservation ID=${reservation.Reservation_ID}`);
            this.logger.log(`   ✅ Payment record created successfully: ID=${savedPayment.id}, Reservation ID=${reservation.Reservation_ID}`);
            return savedPayment;
          });
          
          const savedPayments = await Promise.all(paymentPromises);
          console.log(`✅ Successfully created ${savedPayments.length} payment record(s) in database`);
          this.logger.log(`✅ Created ${savedPayments.length} payment record(s) in database`);
          savedPayments.forEach((savedPayment: Payment, index: number) => {
            const paymentRecordMsg = `   🆔 Payment Record ID: ${savedPayment.id}, Linked to Reservation ID: ${createdReservations[index].Reservation_ID}`;
            console.log(paymentRecordMsg);
            this.logger.log(paymentRecordMsg);
          });
        } catch (dbError) {
          console.error('❌ CRITICAL: Failed to create payment records in database!');
          console.error('   Error message:', dbError.message);
          console.error('   Error stack:', dbError.stack);
          console.error('   Transaction ID:', transactionId);
          console.error('   Reservation IDs:', createdReservations.map(r => r.Reservation_ID).join(', '));
          this.logger.error('❌ CRITICAL: Failed to create payment records in database!', dbError);
          this.logger.error(`   Transaction ID: ${transactionId}`);
          this.logger.error(`   Reservation IDs: ${createdReservations.map(r => r.Reservation_ID).join(', ')}`);
          // Re-throw to be caught by outer try-catch
          throw dbError;
        }
      } else if (reservationId > 0) {
        // Fallback: if no reservations were created but we have a reservationId, create one payment
        try {
          console.log(`💾 Attempting to create payment record for Reservation ID: ${reservationId}...`);
          this.logger.log(`💾 Attempting to create payment record for Reservation ID: ${reservationId}...`);
          
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
          console.log(`✅ Created payment record in database`);
          console.log(`   🆔 Payment Record ID: ${newPayment.id}`);
          console.log(`   🔗 Linked to Reservation ID: ${reservationId}`);
          this.logger.log(`✅ Created payment record in database`);
          this.logger.log(`   🆔 Payment Record ID: ${newPayment.id}`);
          this.logger.log(`   🔗 Linked to Reservation ID: ${reservationId}`);
        } catch (dbError) {
          console.error('❌ CRITICAL: Failed to create payment record in database!');
          console.error('   Error message:', dbError.message);
          console.error('   Error stack:', dbError.stack);
          console.error('   Transaction ID:', transactionId);
          console.error('   Reservation ID:', reservationId);
          this.logger.error('❌ CRITICAL: Failed to create payment record in database!', dbError);
          this.logger.error(`   Transaction ID: ${transactionId}`);
          this.logger.error(`   Reservation ID: ${reservationId}`);
          // Re-throw to be caught by outer try-catch
          throw dbError;
        }
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
          await this.createEquipmentRentalsFromBooking(
            effectiveBookingData.userId,
            firstReservationId,
            effectiveBookingData.equipmentBookings
          );
        }
      } catch (e) {
        this.logger.error('Error saving equipment rentals:', e);
      }
      
      // Custom email receipt removed - PayMongo receipt will be sent automatically

      console.log('───────────────────────────────────────────────────────────');
      console.log('✅ Payment processing completed successfully!');
      console.log('───────────────────────────────────────────────────────────');
      this.logger.log('───────────────────────────────────────────────────────────');
      this.logger.log('✅ Payment processing completed successfully!');
      this.logger.log('───────────────────────────────────────────────────────────');
    } catch (error) {
      console.error('❌ Error handling payment.paid event:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
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
    equipmentBookings: Array<{ equipment: string; time: string; subtotal?: number; quantity?: number; startTime?: string }>,
  ) {
    if (!reservationId || !userId) return;

    // Get reservation to get date and start time
    const reservation = await this.reservationRepository.findOne({
      where: { Reservation_ID: reservationId },
    });

    if (!reservation) {
      this.logger.warn(`Reservation ${reservationId} not found for equipment rental`);
      return;
    }

    const rental = this.rentalRepository.create({
      reservation_id: reservationId,
      user_id: userId,
      total_amount: 0,
    });
    const savedRental = await this.rentalRepository.save(rental);

    // Get default start time from first court booking if available
    const defaultStartTime = reservation.Start_Time || null;

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

      // Calculate rental start and end times
      // IMPORTANT: Rental starts when the court booking starts (reservation Start_Time)
      // This ensures equipment is available during the customer's court booking period
      const reservationDate = reservation.Reservation_Date;
      // Always use the reservation's Start_Time (when court booking starts)
      const courtStartTime = reservation.Start_Time || defaultStartTime;
      
      let rentalStartTime: Date | null = null;
      let rentalEndTime: Date | null = null;
      
      if (courtStartTime && reservationDate) {
        // Parse time string (HH:MM:SS or HH:MM)
        const [startHour, startMin] = courtStartTime.split(':').map(Number);
        const dateObj = new Date(reservationDate);
        // Rental starts when the court booking starts
        rentalStartTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), startHour, startMin || 0, 0);
        
        // Calculate end time by adding rental hours to the court start time
        rentalEndTime = new Date(rentalStartTime);
        rentalEndTime.setHours(rentalEndTime.getHours() + hours);
      }

      const item = this.rentalItemRepository.create({
        rental_id: savedRental.id,
        equipment_id: equipmentRow ? equipmentRow.id : 0,
        quantity,
        hours,
        hourly_price: hourlyPrice,
        subtotal,
        rental_start_time: rentalStartTime,
        rental_end_time: rentalEndTime,
        stock_restored: false,
        notification_sent: false,
      } as Partial<EquipmentRentalItem>);
      await this.rentalItemRepository.save(item);
      
      // Note: Stock is now calculated dynamically based on active rentals
      // No need to decrease stock permanently - available stock = total_stock - active_rentals
      this.logger.log(`Created rental item for ${equipmentRow?.equipment_name || 'unknown'}, quantity: ${quantity}, hours: ${hours}`);
      
      total += subtotal;
    }

    await this.rentalRepository.update(savedRental.id, { total_amount: Number(total.toFixed(2)) });
    this.logger.log(`Saved equipment rental ${savedRental.id} with total ₱${total}`);
  }

  private async createReservationFromPayment(payment: any, bookingData: any): Promise<Reservation[]> {
    const createdReservations: Reservation[] = [];
    try {
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
        this.logger.log(`   👤 User ID: ${bookingData.userId}`);
        
        // Check for duplicate reservation to prevent webhook from creating duplicates
        const existingReservation = await this.reservationRepository.findOne({
          where: {
            User_ID: bookingData.userId,
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
          User_ID: bookingData.userId,
          Court_ID: court.Court_Id,
          Reservation_Date: reservationDate,
          Start_Time: startTime,
          End_Time: endTime,
          Total_Amount: individualPrice, // Use the calculated individual price per court
          Reference_Number: bookingData.referenceNumber || `REF${Date.now()}`,
          Paymongo_Reference_Number: payment.id,
          Notes: `Payment via Paymongo - ${payment.id}`,
          Status: ReservationStatus.CONFIRMED,
          Is_Admin_Created: false, // Important: Set to false so it appears in "My Reservations"
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
