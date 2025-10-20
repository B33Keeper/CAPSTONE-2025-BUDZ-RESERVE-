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
let PaymentController = PaymentController_1 = class PaymentController {
    constructor(payMongoService) {
        this.payMongoService = payMongoService;
        this.logger = new common_1.Logger(PaymentController_1.name);
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
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('create-checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Get)('status/:paymentIntentId'),
    __param(0, (0, common_1.Param)('paymentIntentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentStatus", null);
exports.PaymentController = PaymentController = PaymentController_1 = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [paymongo_service_1.PayMongoService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map