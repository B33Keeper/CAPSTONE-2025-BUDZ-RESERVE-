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
var PaymentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const paymongo_service_1 = require("./paymongo.service");
const email_receipt_service_1 = require("./email-receipt.service");
const payments_service_1 = require("./payments.service");
let PaymentController = PaymentController_1 = class PaymentController {
    constructor(payMongoService, emailReceiptService, paymentsService) {
        this.payMongoService = payMongoService;
        this.emailReceiptService = emailReceiptService;
        this.paymentsService = paymentsService;
        this.logger = new common_1.Logger(PaymentController_1.name);
    }
    async createPaymentIntent(body) {
        try {
            const { amount, description, metadata } = body;
            if (!amount || amount <= 0) {
                throw new Error('Invalid amount');
            }
            const paymentIntent = await this.payMongoService.createPaymentIntent(amount, 'PHP', description, metadata);
            return {
                success: true,
                data: paymentIntent,
            };
        }
        catch (error) {
            this.logger.error('Error creating payment intent:', error);
            return {
                success: false,
                message: error.message || 'Failed to create payment intent',
            };
        }
    }
    async getPaymentIntent(paymentIntentId) {
        try {
            const paymentIntent = await this.payMongoService.getPaymentIntent(paymentIntentId);
            return {
                success: true,
                data: paymentIntent,
            };
        }
        catch (error) {
            this.logger.error('Error getting payment intent:', error);
            return {
                success: false,
                message: error.message || 'Failed to get payment intent',
            };
        }
    }
    async createPaymentMethod(body) {
        try {
            const { type, details, billing } = body;
            const paymentMethod = await this.payMongoService.createPaymentMethod(type, details, billing);
            return {
                success: true,
                data: paymentMethod,
            };
        }
        catch (error) {
            this.logger.error('Error creating payment method:', error);
            return {
                success: false,
                message: error.message || 'Failed to create payment method',
            };
        }
    }
    async attachPaymentMethod(body) {
        try {
            const { paymentIntentId, paymentMethodId, returnUrl } = body;
            const attachedIntent = await this.payMongoService.attachPaymentMethod(paymentIntentId, paymentMethodId, returnUrl);
            return {
                success: true,
                data: attachedIntent,
            };
        }
        catch (error) {
            this.logger.error('Error attaching payment method:', error);
            return {
                success: false,
                message: error.message || 'Failed to attach payment method',
            };
        }
    }
    async processPayment(body) {
        try {
            const { amount, paymentMethodType, paymentDetails, billingInfo, description, metadata, reservationId } = body;
            const paymentResult = await this.payMongoService.processPayment(amount, paymentMethodType, paymentDetails, billingInfo, description, metadata);
            let savedPayment = null;
            if (reservationId) {
                try {
                    savedPayment = await this.paymentsService.create({
                        reservation_id: reservationId,
                        amount: amount,
                        payment_method: paymentMethodType.toUpperCase(),
                        notes: `Paymongo Payment Intent: ${paymentResult.paymentIntent.id}`
                    });
                }
                catch (dbError) {
                    this.logger.warn('Failed to save payment to database:', dbError);
                }
            }
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
                        fee: 0,
                        netAmount: paymentResult.paymentIntent.attributes.amount,
                        referenceNumber: savedPayment?.reference_number,
                    });
                }
                catch (emailError) {
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
        }
        catch (error) {
            this.logger.error('Error processing payment:', error);
            return {
                success: false,
                message: error.message || 'Failed to process payment',
            };
        }
    }
    async getPayment(paymentId) {
        try {
            const payment = await this.payMongoService.getPayment(paymentId);
            return {
                success: true,
                data: payment,
            };
        }
        catch (error) {
            this.logger.error('Error getting payment:', error);
            return {
                success: false,
                message: error.message || 'Failed to get payment',
            };
        }
    }
    async listPayments(limit) {
        try {
            const payments = await this.payMongoService.listPayments(limit || 10);
            return {
                success: true,
                data: payments,
            };
        }
        catch (error) {
            this.logger.error('Error listing payments:', error);
            return {
                success: false,
                message: error.message || 'Failed to list payments',
            };
        }
    }
    async createCheckout(body) {
        try {
            const { amount, description } = body;
            if (!amount || amount <= 0) {
                throw new Error('Invalid amount');
            }
            const checkoutSession = await this.payMongoService.createCheckoutSession(amount, 'PHP', description);
            return {
                success: true,
                data: checkoutSession,
            };
        }
        catch (error) {
            this.logger.error('Error creating checkout session:', error);
            return {
                success: false,
                message: error.message || 'Failed to create checkout session',
            };
        }
    }
    async createCheckoutWithSource(body) {
        try {
            const { amount, description, returnUrl } = body;
            if (!amount || amount <= 0) {
                throw new Error('Invalid amount');
            }
            const checkoutSession = await this.payMongoService.createCheckoutSessionWithSource(amount, 'PHP', description, returnUrl);
            return {
                success: true,
                data: checkoutSession,
            };
        }
        catch (error) {
            this.logger.error('Error creating checkout session with source:', error);
            return {
                success: false,
                message: error.message || 'Failed to create checkout session with source',
            };
        }
    }
    async createCheckoutRedirect(body) {
        try {
            const { amount, description, returnUrl } = body;
            if (!amount || amount <= 0) {
                throw new Error('Invalid amount');
            }
            const checkoutSession = await this.payMongoService.createCheckoutSessionWithRedirect(amount, 'PHP', description, returnUrl);
            return {
                success: true,
                data: checkoutSession,
            };
        }
        catch (error) {
            this.logger.error('Error creating checkout session with redirect:', error);
            return {
                success: false,
                message: error.message || 'Failed to create checkout session with redirect',
            };
        }
    }
    async createPaymongoCheckout(body) {
        try {
            const { amount, description, returnUrl, billingInfo, bookingData } = body;
            if (!amount || amount <= 0) {
                throw new Error('Invalid amount');
            }
            let parsedBookingData = null;
            if (bookingData) {
                try {
                    parsedBookingData = JSON.parse(bookingData);
                }
                catch (error) {
                    this.logger.warn('Failed to parse booking data:', error);
                }
            }
            const checkoutSession = await this.payMongoService.createPaymongoCheckout(amount, 'PHP', description, returnUrl, billingInfo, parsedBookingData);
            return {
                success: true,
                data: checkoutSession,
            };
        }
        catch (error) {
            this.logger.error('Error creating Paymongo checkout:', error);
            return {
                success: false,
                message: error.message || 'Failed to create Paymongo checkout',
            };
        }
    }
    async getPaymentStatus(paymentIntentId) {
        try {
            const paymentIntent = await this.payMongoService.getPaymentIntent(paymentIntentId);
            return {
                success: true,
                data: paymentIntent,
            };
        }
        catch (error) {
            this.logger.error('Error getting payment status:', error);
            return {
                success: false,
                message: error.message || 'Failed to get payment status',
            };
        }
    }
    async getReceipt(paymentId) {
        try {
            const payment = await this.payMongoService.getPayment(paymentId);
            const receiptData = {
                paymentId: payment.id,
                amount: payment.attributes.amount,
                currency: payment.attributes.currency,
                status: payment.attributes.status,
                paidAt: payment.attributes.paid_at ? new Date(payment.attributes.paid_at * 1000) : null,
                receipt_url: `https://paymongo.com/receipts/${payment.id}`,
                billing: payment.attributes.billing,
                description: payment.attributes.description,
            };
            return {
                success: true,
                data: receiptData,
            };
        }
        catch (error) {
            this.logger.error('Error getting receipt:', error);
            return {
                success: false,
                message: error.message || 'Failed to get receipt',
            };
        }
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('create-intent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createPaymentIntent", null);
__decorate([
    (0, common_1.Get)('intent/:paymentIntentId'),
    __param(0, (0, common_1.Param)('paymentIntentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentIntent", null);
__decorate([
    (0, common_1.Post)('create-method'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createPaymentMethod", null);
__decorate([
    (0, common_1.Post)('attach-method'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "attachPaymentMethod", null);
__decorate([
    (0, common_1.Post)('process'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Get)('payment/:paymentId'),
    __param(0, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPayment", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, common_1.Param)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Post)('create-checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Post)('create-checkout-with-source'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createCheckoutWithSource", null);
__decorate([
    (0, common_1.Post)('create-checkout-redirect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createCheckoutRedirect", null);
__decorate([
    (0, common_1.Post)('create-paymongo-checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createPaymongoCheckout", null);
__decorate([
    (0, common_1.Get)('status/:paymentIntentId'),
    __param(0, (0, common_1.Param)('paymentIntentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentStatus", null);
__decorate([
    (0, common_1.Get)('receipt/:paymentId'),
    __param(0, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getReceipt", null);
exports.PaymentController = PaymentController = PaymentController_1 = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [paymongo_service_1.PayMongoService,
        email_receipt_service_1.EmailReceiptService,
        payments_service_1.PaymentsService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map