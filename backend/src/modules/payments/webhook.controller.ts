import { Controller, Post, Get, Body, Headers, Logger, HttpCode, HttpStatus, Req, UsePipes } from '@nestjs/common';
import { WebhookValidationPipe } from '../../pipes/webhook-validation.pipe';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
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
    private readonly dataSource: DataSource,
  ) {}

  @Get('paymongo/test')
  @HttpCode(HttpStatus.OK)
  async testWebhookEndpoint(@Req() req: Request) {
    console.log('🧪 Test webhook endpoint called (GET)');
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

  @Post('paymongo/test')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new WebhookValidationPipe())
  async testWebhookSimulation(
    @Body() testData: {
      userId?: number;
      selectedDate?: string;
      courtBookings?: Array<{ court: string; schedule: string; subtotal: number }>;
      equipmentBookings?: Array<any>;
      referenceNumber?: string;
      amount?: number;
    },
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    try {
      this.logger.log('🧪 Test webhook simulation triggered');
      
      // Create a simulated PayMongo webhook payload
      const testPaymentId = `pay_test_${Date.now()}`;
      const testCheckoutSessionId = `cs_test_${Date.now()}`;
      const amount = testData.amount || 75000; // Default to 750 PHP in centavos
      
      const bookingData = {
        userId: testData.userId || 1,
        selectedDate: testData.selectedDate || new Date().toISOString().split('T')[0],
        courtBookings: testData.courtBookings || [
          { court: 'Court 1', schedule: '8:00 AM - 9:00 AM', subtotal: 250 }
        ],
        equipmentBookings: testData.equipmentBookings || [],
        referenceNumber: testData.referenceNumber || `REF${Date.now()}`,
      };

      console.log('📦 Test Data Received:');
      console.log(JSON.stringify(testData, null, 2));
      this.logger.log(`📦 Test Data: ${JSON.stringify(testData, null, 2)}`);

      // Simulate checkout_session.payment.paid event
      const simulatedWebhookPayload = {
        data: {
          id: testCheckoutSessionId,
          type: 'event',
          attributes: {
            type: 'checkout_session.payment.paid',
            livemode: false,
            data: {
              id: testCheckoutSessionId,
              type: 'checkout_session',
              attributes: {
                id: testCheckoutSessionId,
                type: 'checkout_session',
                amount: amount,
                currency: 'PHP',
                status: 'paid',
                payment_intent: {
                  id: `pi_test_${Date.now()}`,
                  type: 'payment_intent',
                },
                payments: {
                  data: [
                    {
                      id: testPaymentId,
                      type: 'payment',
                    }
                  ]
                },
                metadata: {
                  bookingData: JSON.stringify(bookingData),
                },
              },
            },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      };

      console.log('📤 Simulated Webhook Payload:');
      console.log(JSON.stringify(simulatedWebhookPayload, null, 2));
      this.logger.log(`📤 Simulated Payload: ${JSON.stringify(simulatedWebhookPayload, null, 2)}`);

      // Process the simulated webhook
      const { data } = simulatedWebhookPayload;
      const eventType = data.attributes.type;
      const paymentData = data.attributes.data;

      console.log(`📥 Simulated Event Type: ${eventType}`);
      console.log(`🆔 Simulated Event ID: ${data.id}`);
      this.logger.log(`📥 Simulated Event Type: ${eventType}`);
      this.logger.log(`🆔 Simulated Event ID: ${data.id}`);

      // Handle the simulated checkout_session.payment.paid event
      if (eventType === 'checkout_session.payment.paid') {
        console.log('✅ Processing simulated checkout_session.payment.paid event...');
        this.logger.log('✅ Processing simulated checkout_session.payment.paid event...');
        
        const csAttr: any = paymentData.attributes;
        if (csAttr && csAttr.metadata?.bookingData) {
          const bookingDataFromSession = JSON.parse(csAttr.metadata.bookingData);
          console.log(`✅ Booking data found in simulated checkout session`);
          console.log(`   👤 User ID: ${bookingDataFromSession?.userId}`);
          console.log(`   📅 Date: ${bookingDataFromSession?.selectedDate}`);
          console.log(`   🏸 Courts: ${bookingDataFromSession?.courtBookings?.length || 0}`);
          this.logger.log(`✅ Booking data found in simulated checkout session`);
          this.logger.log(`   👤 User ID: ${bookingDataFromSession?.userId}`);
          this.logger.log(`   📅 Date: ${bookingDataFromSession?.selectedDate}`);
          this.logger.log(`   🏸 Courts: ${bookingDataFromSession?.courtBookings?.length || 0}`);

          // Extract payment id
          const paymentId = csAttr.payments?.data?.[0]?.id || testPaymentId;
          console.log(`💳 Simulated Payment ID: ${paymentId}`);
          this.logger.log(`💳 Simulated Payment ID: ${paymentId}`);

          // Create a complete payment object with attributes to avoid PayMongo API call
          // This simulates what PayMongo would send in a real webhook
          const simulatedPayment = {
            id: paymentId,
            attributes: {
              amount: amount,
              currency: 'PHP',
              status: 'paid',
              description: `Test Payment - ${bookingData.referenceNumber}`,
              source: {
                type: 'gcash', // Default to GCash for test
              },
              metadata: {
                bookingData: JSON.stringify(bookingData),
              },
            },
          };

          console.log(`📦 Using simulated payment object (no PayMongo API call needed)`);
          this.logger.log(`📦 Using simulated payment object (no PayMongo API call needed)`);

          // Process the payment with complete attributes
          await this.handlePaymentPaid(simulatedPayment, bookingDataFromSession);
        } else {
          console.warn('⚠️ No booking data in simulated payload');
          this.logger.warn('⚠️ No booking data in simulated payload');
        }
      }

      this.logger.log('✅ Test webhook simulation completed');

      return {
        success: true,
        message: 'Test webhook simulation completed successfully!',
        timestamp: new Date().toISOString(),
        simulatedPaymentId: testPaymentId,
        simulatedCheckoutSessionId: testCheckoutSessionId,
        bookingData: bookingData,
      };
    } catch (error) {
      console.error('❌ Error in test webhook simulation:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      this.logger.error('❌ Error in test webhook simulation:', error);
      return {
        success: false,
        message: `Test webhook simulation failed: ${error.message}`,
        error: error.message,
        stack: error.stack,
      };
    }
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
      // Reduced logging to prevent Railway rate limits
      this.logger.log(`🔔 PayMongo Webhook: ${req.method} ${req.originalUrl}`);
      
      // Log webhook configuration status (only in production if missing)
      if (!process.env.PAYMONGO_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
        this.logger.warn('⚠️ PAYMONGO_WEBHOOK_SECRET not configured in production!');
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
      
      this.logger.log(`📥 Event: ${eventType} (ID: ${data.id})`);

      switch (eventType) {
        case 'payment.paid':
          this.logger.log('✅ Processing payment.paid event...');
          await this.handlePaymentPaid(paymentData);
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
                this.logger.log(`✅ Booking data found: User ${bookingDataFromSession?.userId}, Date ${bookingDataFromSession?.selectedDate}, ${bookingDataFromSession?.courtBookings?.length || 0} court(s), ${bookingDataFromSession?.equipmentBookings?.length || 0} equipment`);
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

      this.logger.log('✅ Webhook processed successfully');
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`❌ Error processing webhook: ${error.message}`, error.stack);
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
    // Use a database transaction with locking to prevent concurrent duplicate processing
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Prefer payment details from webhook payload; fallback to API fetch
      // CRITICAL: Always fetch from API to get the latest payment status
      // Webhook payload might have stale status, especially in test mode
      const payment = await this.payMongoService.getPayment(paymentData.id);
      
      const amount = (payment.attributes.amount / 100).toFixed(2);
      const paymentMethodType = payment.attributes.source?.type || 'Unknown';
      const status = payment.attributes.status;
      
      // Reduced logging - combine into single log statement
      this.logger.log(`💳 Processing Payment ${paymentData.id}: ₱${amount} via ${paymentMethodType}, Status: ${status}`);
      
      // CRITICAL: Only process if payment status is actually "paid"
      // PayMongo may send webhooks before payment is authorized (especially in test mode)
      if (status !== 'paid') {
        await queryRunner.rollbackTransaction();
        this.logger.log(`⏸️ Payment ${payment.id} status is "${status}", not "paid". Skipping processing.`);
        return; // Exit early - payment not yet paid
      }
      
      // CRITICAL: Idempotency check - prevent duplicate processing if webhook is called multiple times
      // Use transaction's repository to ensure we're checking within the same transaction
      const transactionId = payment.id; // PayMongo payment ID is the transaction ID
      
      // Get booking data early for duplicate checking
      const bookingDataRaw = payment.attributes?.metadata?.bookingData || (bookingDataOverride ? JSON.stringify(bookingDataOverride) : undefined);
      let bookingReferenceNumber: string | null = null;
      
      if (bookingDataRaw) {
        try {
          const bookingData = typeof bookingDataRaw === 'string' ? JSON.parse(bookingDataRaw) : bookingDataRaw;
          bookingReferenceNumber = bookingData.referenceNumber || null;
        } catch (e) {
          // Ignore parsing errors, will check later
        }
      }
      
      // CRITICAL: Use transaction repository with locking to prevent race conditions
      // First check if payment already exists (with lock)
      const existingPayment = await queryRunner.manager.findOne(Payment, {
        where: { transaction_id: transactionId },
        lock: { mode: 'pessimistic_write' }, // Lock the row to prevent concurrent access
      });
      
      if (existingPayment) {
        await queryRunner.rollbackTransaction();
        this.logger.log(`✅ Duplicate webhook ignored: Payment ${transactionId} already processed (Payment ID: ${existingPayment.id})`);
        return; // Exit early - payment already processed
      }
      
      // Also check if reservations with this PayMongo reference already exist (with lock)
      const existingReservationsByPaymongo = await queryRunner.manager.find(Reservation, {
        where: { Paymongo_Reference_Number: transactionId },
        lock: { mode: 'pessimistic_write' },
      });
      
      if (existingReservationsByPaymongo && existingReservationsByPaymongo.length > 0) {
        await queryRunner.rollbackTransaction();
        this.logger.log(`✅ Duplicate webhook ignored: Reservations for ${transactionId} already exist (${existingReservationsByPaymongo.length} reservation(s))`);
        return; // Exit early - reservations already exist for this payment
      }
      
      // CRITICAL: Check for reservations with the same booking reference number (with lock)
      // This is the most reliable check since reference number is set before payment
      if (bookingReferenceNumber) {
        const existingReservationsByRef = await queryRunner.manager.find(Reservation, {
          where: { Reference_Number: bookingReferenceNumber },
          lock: { mode: 'pessimistic_write' },
        });
        
        if (existingReservationsByRef && existingReservationsByRef.length > 0) {
          await queryRunner.rollbackTransaction();
          this.logger.log(`✅ Duplicate webhook ignored: Booking ${bookingReferenceNumber} already processed (${existingReservationsByRef.length} reservation(s))`);
          return; // Exit early - reservations already exist for this booking reference
        }
      }
      
      // Create reservation FIRST if booking data is in metadata or provided by caller (checkout session)
      let reservationId = 0;
      let createdReservations: Reservation[] = [];
      // bookingDataRaw is already declared above for duplicate checking
      if (bookingDataRaw) {
        try {
          const bookingData = typeof bookingDataRaw === 'string' ? JSON.parse(bookingDataRaw) : bookingDataRaw;
          this.logger.log(`📋 Creating reservations: User ${bookingData.userId}, Date ${bookingData.selectedDate}, ${bookingData.courtBookings?.length || 0} court(s)`);
          
          // Use transaction manager to create reservations within the transaction
          createdReservations = await this.createReservationFromPaymentWithTransaction(queryRunner, payment, bookingData);
          
          // Get the first created reservation ID
          if (createdReservations.length > 0) {
            reservationId = createdReservations[0].Reservation_ID;
            const resIds = createdReservations.map(r => r.Reservation_ID).join(', ');
            this.logger.log(`✅ Created ${createdReservations.length} reservation(s): IDs ${resIds}, Ref: ${createdReservations[0].Reference_Number}`);
          } else {
            await queryRunner.rollbackTransaction();
            this.logger.warn('⚠️ No reservations were created');
            return;
          }
        } catch (error) {
          await queryRunner.rollbackTransaction();
          this.logger.error(`❌ Error creating reservation: ${error.message}`, error.stack);
          throw error;
        }
      } else {
        await queryRunner.rollbackTransaction();
        this.logger.warn('⚠️ No booking data found in payment metadata. Cannot create reservations.');
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
        // Create a payment record for each reservation using transaction manager
        try {
          const paymentPromises = createdReservations.map(async (reservation: Reservation) => {
            // Calculate amount per reservation (divide total by number of reservations)
            // Or use the reservation's total amount if available
            const reservationAmount = Number(reservation.Total_Amount) || (totalAmount / createdReservations.length);
            
            const newPayment = queryRunner.manager.create(Payment, {
              reservation_id: reservation.Reservation_ID,
              amount: reservationAmount,
              payment_method: paymentMethod,
              transaction_id: transactionId,
              reference_number: referenceNumber,
              notes: payment.attributes.description,
              status: payment.attributes.status === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
            });
            
            const savedPayment = await queryRunner.manager.save(Payment, newPayment);
            return savedPayment;
          });
          
          const savedPayments = await Promise.all(paymentPromises);
          const paymentIds = savedPayments.map(p => p.id).join(', ');
          this.logger.log(`✅ Created ${savedPayments.length} payment record(s): IDs ${paymentIds}`);
        } catch (dbError) {
          await queryRunner.rollbackTransaction();
          this.logger.error(`❌ Failed to create payment records: ${dbError.message}`, dbError.stack);
          throw dbError;
        }
      } else if (reservationId > 0) {
        // Fallback: if no reservations were created but we have a reservationId, create one payment
        try {
          const newPayment = queryRunner.manager.create(Payment, {
            reservation_id: reservationId,
            amount: totalAmount,
            payment_method: paymentMethod,
            transaction_id: transactionId,
            reference_number: referenceNumber,
            notes: payment.attributes.description,
            status: payment.attributes.status === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
          });
          
          const savedPayment = await queryRunner.manager.save(Payment, newPayment);
          this.logger.log(`✅ Created payment record ID: ${savedPayment.id} for Reservation ${reservationId}`);
        } catch (dbError) {
          await queryRunner.rollbackTransaction();
          this.logger.error(`❌ Failed to create payment record: ${dbError.message}`, dbError.stack);
          throw dbError;
        }
      }
      
      // Commit the transaction FIRST before creating equipment rentals
      // Equipment rentals need to query the database, so reservation must be committed
      await queryRunner.commitTransaction();
      
      // Persist equipment rentals if present in booking data (after transaction commit)
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
        // Equipment rental errors are non-critical - log but don't fail the entire process
        console.error('⚠️ Error saving equipment rentals (non-critical):', e.message);
        this.logger.error('Error saving equipment rentals:', e);
      }
      
      // Custom email receipt removed - PayMongo receipt will be sent automatically
      // Transaction already committed above before equipment rentals

      this.logger.log(`✅ Payment ${paymentData.id} processed successfully`);
    } catch (error) {
      // Rollback transaction on any error
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Error processing payment ${paymentData.id}: ${error.message}`, error.stack);
      throw error; // Re-throw to be caught by caller
    } finally {
      // Release the query runner
      await queryRunner.release();
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
    equipmentBookings: Array<{ equipment: string; time: string; subtotal?: number; quantity?: number; startTime?: string; selectedCourtSchedules?: string[] }>,
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

      const reservationDate = typeof reservation.Reservation_Date === 'string' 
        ? reservation.Reservation_Date 
        : new Date(reservation.Reservation_Date).toISOString().split('T')[0];
      
      // IMPORTANT: When equipment is rented for multiple schedules, create SEPARATE rental items for EACH schedule
      // This ensures stock is reduced for each specific schedule time slot
      if (b.selectedCourtSchedules && b.selectedCourtSchedules.length > 0 && equipmentRow) {
        this.logger.log(
          `[Webhook Equipment Rental] Multi-schedule rental detected: ${b.selectedCourtSchedules.length} schedule(s) selected: ${b.selectedCourtSchedules.join(', ')}`
        );
        
        // Create a separate rental item for EACH schedule
        for (const scheduleKey of b.selectedCourtSchedules) {
          let scheduleRentalStartTime: Date | null = null;
          let scheduleRentalEndTime: Date | null = null;
          
          // Parse schedule key to get time directly (format: "Court Name-Start Time - End Time")
          const firstDashIndex = scheduleKey.indexOf('-');
          if (firstDashIndex > 0) {
            const scheduleStr = scheduleKey.substring(firstDashIndex + 1).trim();
            const timeMatch = scheduleStr.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i);
            if (timeMatch) {
              const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
              const convertTo24Hour = (hour: number, period: string): number => {
                let h = parseInt(hour.toString());
                if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
                else if (period.toUpperCase() === 'AM' && h === 12) h = 0;
                return h;
              };
              
              const startH = convertTo24Hour(parseInt(startHour), startPeriod);
              const endH = convertTo24Hour(parseInt(endHour), endPeriod);
              
              const [year, month, day] = reservationDate.split('-').map(Number);
              scheduleRentalStartTime = new Date(year, month - 1, day, startH, parseInt(startMin), 0);
              const scheduleEnd = new Date(year, month - 1, day, endH, parseInt(endMin), 0);
              
              const minEndTime = new Date(scheduleRentalStartTime);
              minEndTime.setHours(minEndTime.getHours() + hours);
              scheduleRentalEndTime = scheduleEnd > minEndTime ? scheduleEnd : minEndTime;
              
              // Create rental item for this specific schedule
              const scheduleSubtotal = b.subtotal != null && b.subtotal > 0 
                ? Number((b.subtotal / b.selectedCourtSchedules.length).toFixed(2))
                : Number((hourlyPrice * hours * quantity).toFixed(2));
              
              const item = this.rentalItemRepository.create({
                rental_id: savedRental.id,
                equipment_id: equipmentRow.id,
                quantity: quantity,
                hours: hours,
                hourly_price: hourlyPrice,
                subtotal: scheduleSubtotal,
                rental_start_time: scheduleRentalStartTime,
                rental_end_time: scheduleRentalEndTime,
                stock_restored: false,
                notification_sent: false,
              } as Partial<EquipmentRentalItem>);
              
              await this.rentalItemRepository.save(item);
              total += scheduleSubtotal;
              
              this.logger.log(
                `[Webhook] Created rental item ${item.id} for ${equipmentRow.equipment_name} ` +
                `(qty: ${quantity}) for schedule ${scheduleKey}. Stock reduced for this schedule.`
              );
            }
          }
        }
        
        // Skip single rental item creation since we've created separate items for each schedule
        continue;
      }

      // Single schedule or no selectedCourtSchedules - use reservation's time
      let rentalStartTime: Date | null = null;
      let rentalEndTime: Date | null = null;
      
      const courtStartTime = reservation.Start_Time || defaultStartTime;
      if (courtStartTime && reservationDate) {
        const [startHour, startMin] = courtStartTime.split(':').map(Number);
        const dateObj = new Date(reservationDate);
        rentalStartTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), startHour, startMin || 0, 0);
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
      
      this.logger.log(`Created rental item for ${equipmentRow?.equipment_name || 'unknown'}, quantity: ${quantity}, hours: ${hours}`);
      
      total += subtotal;
    }

    await this.rentalRepository.update(savedRental.id, { total_amount: Number(total.toFixed(2)) });
    this.logger.log(`Saved equipment rental ${savedRental.id} with total ₱${total}`);
  }

  private async createReservationFromPaymentWithTransaction(
    queryRunner: any,
    payment: any,
    bookingData: any
  ): Promise<Reservation[]> {
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
        
        // Check for duplicate reservation using transaction manager with lock
        const existingReservation = await queryRunner.manager.findOne(Reservation, {
          where: {
            User_ID: bookingData.userId,
            Court_ID: court.Court_Id,
            Reservation_Date: reservationDate,
            Start_Time: startTime,
            End_Time: endTime,
            Paymongo_Reference_Number: payment.id,
            Status: ReservationStatus.CONFIRMED,
          },
          lock: { mode: 'pessimistic_write' },
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
        
        const reservation = queryRunner.manager.create(Reservation, {
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

        const savedReservation = await queryRunner.manager.save(Reservation, reservation);
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
