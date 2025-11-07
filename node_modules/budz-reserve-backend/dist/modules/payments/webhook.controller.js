"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const paymongo_service_1 = require("./paymongo.service");
const email_receipt_service_1 = require("./email-receipt.service");
const payments_service_1 = require("./payments.service");
const payment_entity_1 = require("./entities/payment.entity");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
const equipment_rental_entity_1 = require("./entities/equipment-rental.entity");
const equipment_rental_item_entity_1 = require("./entities/equipment-rental-item.entity");
const equipment_entity_1 = require("../equipment/entities/equipment.entity");
const courts_service_1 = require("../courts/courts.service");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(payMongoService, emailReceiptService, paymentsService, courtsService, reservationRepository, paymentRepository, rentalRepository, rentalItemRepository, equipmentRepository) {
        this.payMongoService = payMongoService;
        this.emailReceiptService = emailReceiptService;
        this.paymentsService = paymentsService;
        this.courtsService = courtsService;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.rentalRepository = rentalRepository;
        this.rentalItemRepository = rentalItemRepository;
        this.equipmentRepository = equipmentRepository;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async testWebhook(testData) {
        this.logger.log('Processing test webhook');
        try {
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
                                amount: testData.amount * 100,
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
            await this.handleTestPayment(mockWebhookEvent.data.attributes.data, testData);
            return { success: true, message: 'Test webhook processed successfully' };
        }
        catch (error) {
            this.logger.error('Error in test webhook:', error);
            return { success: false, message: 'Test webhook failed', error: error.message };
        }
    }
    async handlePaymongoWebhook(body, signature) {
        try {
            this.logger.log('Paymongo webhook received');
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
                case 'checkout_session.payment.paid':
                    if (paymentData && paymentData.type === 'checkout_session' && paymentData.attributes) {
                        const csAttr = paymentData.attributes;
                        let bookingDataFromSession;
                        try {
                            if (csAttr.metadata?.bookingData) {
                                bookingDataFromSession = JSON.parse(csAttr.metadata.bookingData);
                            }
                        }
                        catch { }
                        let paymentId;
                        const paymentsRel = csAttr.payments?.data ?? csAttr.payments ?? [];
                        if (Array.isArray(paymentsRel) && paymentsRel.length > 0) {
                            paymentId = paymentsRel[0]?.id;
                        }
                        if (!paymentId && csAttr.payment_intent?.id) {
                            await this.handleCheckoutSessionPaid(data.id);
                            break;
                        }
                        if (paymentId) {
                            await this.handlePaymentPaid({ id: paymentId }, bookingDataFromSession);
                            break;
                        }
                    }
                    await this.handleCheckoutSessionPaid(data.id);
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
        }
        catch (error) {
            this.logger.error('Error processing webhook:', error);
            return { success: false, message: 'Webhook processing failed' };
        }
    }
    async handleCheckoutSessionPaid(checkoutSessionId) {
        try {
            this.logger.log(`Fetching checkout session ${checkoutSessionId} to resolve payment`);
            const session = await this.payMongoService.getCheckoutSession(checkoutSessionId);
            let bookingDataFromSession;
            try {
                const md = session?.attributes?.metadata;
                if (md && md.bookingData) {
                    bookingDataFromSession = JSON.parse(md.bookingData);
                }
            }
            catch (e) {
                this.logger.warn(`Failed to parse bookingData from checkout session ${checkoutSessionId}`);
            }
            let paymentId;
            const attributes = session?.attributes ?? {};
            const payments = attributes.payments?.data ?? attributes.payments ?? [];
            if (Array.isArray(payments) && payments.length > 0) {
                paymentId = payments[0]?.id;
            }
            if (!paymentId && attributes.payment_intent?.id) {
                try {
                    const pi = await this.payMongoService.getPaymentIntent(attributes.payment_intent.id);
                    const latestPaymentId = pi?.attributes?.latest_payment_id || pi?.attributes?.payments?.[0]?.id;
                    if (latestPaymentId)
                        paymentId = latestPaymentId;
                }
                catch (e) {
                    this.logger.warn(`Could not resolve payment from payment_intent ${attributes.payment_intent?.id}`);
                }
            }
            if (!paymentId) {
                this.logger.warn(`No payment id found for checkout session ${checkoutSessionId}`);
                return;
            }
            await this.handlePaymentPaid({ id: paymentId }, bookingDataFromSession);
        }
        catch (error) {
            this.logger.error('Error handling checkout_session.payment.paid event:', error);
        }
    }
    async handlePaymentPaid(paymentData, bookingDataOverride) {
        try {
            this.logger.log(`Processing payment: ${paymentData.id}`);
            const payment = paymentData?.attributes
                ? { id: paymentData.id, attributes: paymentData.attributes }
                : await this.payMongoService.getPayment(paymentData.id);
            let reservationId = 0;
            const bookingDataRaw = payment.attributes?.metadata?.bookingData || (bookingDataOverride ? JSON.stringify(bookingDataOverride) : undefined);
            if (bookingDataRaw) {
                try {
                    const bookingData = typeof bookingDataRaw === 'string' ? JSON.parse(bookingDataRaw) : bookingDataRaw;
                    const createdReservations = await this.createReservationFromPayment(payment, bookingData);
                    if (createdReservations.length > 0) {
                        reservationId = createdReservations[0].Reservation_ID;
                        this.logger.log(`Created reservation ${reservationId}`);
                    }
                }
                catch (error) {
                    this.logger.error('Error creating reservation from payment metadata:', error);
                }
            }
            const newPayment = this.paymentRepository.create({
                reservation_id: reservationId,
                amount: payment.attributes.amount / 100,
                payment_method: this.mapPaymentMethod(payment.attributes.source?.type),
                transaction_id: payment.id,
                reference_number: `REF${Date.now()}`,
                notes: payment.attributes.description,
                status: payment.attributes.status === 'paid' ? payment_entity_1.PaymentStatus.COMPLETED : payment_entity_1.PaymentStatus.PENDING,
            });
            await this.paymentRepository.save(newPayment);
            this.logger.log(`Created payment record ${newPayment.id}`);
            try {
                const effectiveBookingData = bookingDataOverride
                    ? bookingDataOverride
                    : (payment.attributes?.metadata?.bookingData ? JSON.parse(payment.attributes.metadata.bookingData) : undefined);
                if (effectiveBookingData?.equipmentBookings?.length && reservationId) {
                    await this.createEquipmentRentalsFromBooking(effectiveBookingData.userId, reservationId, effectiveBookingData.equipmentBookings);
                }
            }
            catch (e) {
                this.logger.error('Error saving equipment rentals:', e);
            }
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
                    last4: '****',
                },
                fee: payment.attributes.fee,
                netAmount: payment.attributes.net_amount,
            });
            this.logger.log('Payment receipt sent');
        }
        catch (error) {
            this.logger.error('Error handling payment.paid event:', error);
        }
    }
    parseHours(timeLabel) {
        if (!timeLabel)
            return 1;
        const m = String(timeLabel).match(/(\d+)\s*(h|hr|hrs|hour)/i);
        if (m)
            return parseInt(m[1], 10);
        const m2 = String(timeLabel).match(/(\d+)/);
        return m2 ? parseInt(m2[1], 10) : 1;
    }
    async createEquipmentRentalsFromBooking(userId, reservationId, equipmentBookings) {
        if (!reservationId || !userId)
            return;
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
            let equipmentRow = await this.equipmentRepository.findOne({ where: { equipment_name: (0, typeorm_2.Like)(`%${b.equipment}%`) } });
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
    async createReservationFromPayment(payment, bookingData) {
        const createdReservations = [];
        try {
            for (const courtBooking of bookingData.courtBookings || []) {
                const courts = await this.courtsService.findAll();
                const court = courts.find(c => c.Court_Name === courtBooking.court);
                if (!court) {
                    this.logger.error(`Court "${courtBooking.court}" not found for reservation.`);
                    continue;
                }
                const [startTime, endTime] = this.parseScheduleToTimes(courtBooking.schedule);
                const reservation = this.reservationRepository.create({
                    User_ID: bookingData.userId,
                    Court_ID: court.Court_Id,
                    Reservation_Date: new Date(bookingData.selectedDate),
                    Start_Time: startTime,
                    End_Time: endTime,
                    Total_Amount: courtBooking.subtotal ?? payment.attributes.amount / 100,
                    Reference_Number: bookingData.referenceNumber || `REF${Date.now()}`,
                    Paymongo_Reference_Number: payment.id,
                    Notes: `Payment via Paymongo - ${payment.id}`,
                    Status: reservation_entity_1.ReservationStatus.CONFIRMED,
                });
                await this.reservationRepository.save(reservation);
                createdReservations.push(reservation);
                this.logger.log(`Created reservation ${reservation.Reservation_ID} for payment ${payment.id}`);
            }
        }
        catch (error) {
            this.logger.error('Error creating reservation from payment:', error);
            throw error;
        }
        return createdReservations;
    }
    async handlePaymentFailed(paymentData) {
        try {
            this.logger.log('Processing payment.failed event:', paymentData.id);
            this.logger.warn(`Payment failed: ${paymentData.id}`);
        }
        catch (error) {
            this.logger.error('Error handling payment.failed event:', error);
        }
    }
    async handlePaymentIntentSucceeded(paymentIntentData) {
        try {
            this.logger.log('Processing payment_intent.succeeded event:', paymentIntentData.id);
            this.logger.log(`Payment intent succeeded: ${paymentIntentData.id}`);
        }
        catch (error) {
            this.logger.error('Error handling payment_intent.succeeded event:', error);
        }
    }
    async handlePaymentIntentFailed(paymentIntentData) {
        try {
            this.logger.log('Processing payment_intent.failed event:', paymentIntentData.id);
            this.logger.warn(`Payment intent failed: ${paymentIntentData.id}`);
        }
        catch (error) {
            this.logger.error('Error handling payment_intent.failed event:', error);
        }
    }
    verifyWebhookSignature(body, signature) {
        const _secret = process.env.PAYMONGO_WEBHOOK_SECRET || 'whsk_7Myz2HAE5CZ3Td5V2gvVwrim';
        return true;
    }
    async handleTestPayment(paymentData, testData) {
        try {
            this.logger.log('Processing test payment');
            let reservationId = 0;
            if (testData.bookingData) {
                try {
                    const createdReservations = await this.createReservationFromTestData(testData.bookingData);
                    if (createdReservations.length > 0) {
                        reservationId = createdReservations[0].Reservation_ID;
                        this.logger.log(`Created test reservation ${reservationId}`);
                    }
                }
                catch (error) {
                    this.logger.error('Error creating test reservation:', error);
                }
            }
            const newPayment = this.paymentRepository.create({
                reservation_id: reservationId,
                amount: testData.amount,
                payment_method: this.mapPaymentMethod(testData.paymentMethod),
                transaction_id: testData.paymentId,
                reference_number: `REF${Date.now()}`,
                notes: `Test payment - ${testData.paymentMethod}`,
                status: payment_entity_1.PaymentStatus.COMPLETED,
            });
            await this.paymentRepository.save(newPayment);
            this.logger.log(`Created test payment record ${newPayment.id}`);
        }
        catch (error) {
            this.logger.error('Error handling test payment:', error);
            throw error;
        }
    }
    async createReservationFromTestData(bookingData) {
        const createdReservations = [];
        try {
            for (const courtBooking of bookingData.courtBookings || []) {
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
                    Status: reservation_entity_1.ReservationStatus.CONFIRMED,
                });
                await this.reservationRepository.save(reservation);
                createdReservations.push(reservation);
                this.logger.log(`Created test reservation ${reservation.Reservation_ID}`);
            }
        }
        catch (error) {
            this.logger.error('Error creating test reservation:', error);
            throw error;
        }
        return createdReservations;
    }
    parseScheduleToTimes(schedule) {
        const parts = schedule.split(' - ');
        if (parts.length === 2) {
            const parseTime = (timeStr) => {
                const [time, ampm] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (ampm === 'PM' && hours < 12)
                    hours += 12;
                if (ampm === 'AM' && hours === 12)
                    hours = 0;
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
            };
            return [parseTime(parts[0]), parseTime(parts[1])];
        }
        return ['00:00:00', '00:00:00'];
    }
    mapPaymentMethod(paymongoType) {
        switch (paymongoType?.toLowerCase()) {
            case 'gcash':
                return payment_entity_1.PaymentMethod.GCASH;
            case 'paymaya':
                return payment_entity_1.PaymentMethod.MAYA;
            case 'grab_pay':
                return payment_entity_1.PaymentMethod.GRABPAY;
            case 'card':
                return payment_entity_1.PaymentMethod.BANKING;
            case 'cash':
                return payment_entity_1.PaymentMethod.CASH;
            default:
                return payment_entity_1.PaymentMethod.GCASH;
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('test-webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "testWebhook", null);
__decorate([
    (0, common_1.Post)('paymongo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('paymongo-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handlePaymongoWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhook'),
    __param(4, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(5, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(6, (0, typeorm_1.InjectRepository)(equipment_rental_entity_1.EquipmentRental)),
    __param(7, (0, typeorm_1.InjectRepository)(equipment_rental_item_entity_1.EquipmentRentalItem)),
    __param(8, (0, typeorm_1.InjectRepository)(equipment_entity_1.Equipment)),
    __metadata("design:paramtypes", [paymongo_service_1.PayMongoService,
        email_receipt_service_1.EmailReceiptService,
        payments_service_1.PaymentsService,
        courts_service_1.CourtsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map