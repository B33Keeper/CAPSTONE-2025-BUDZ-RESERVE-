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
var PayMongoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayMongoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PayMongoService = PayMongoService_1 = class PayMongoService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PayMongoService_1.name);
        this.baseUrl = 'https://api.paymongo.com/v1';
        this.secretKey = this.configService.get('PAYMONGO_SECRET_KEY') || '';
        this.publicKey = this.configService.get('PAYMONGO_PUBLIC_KEY') || '';
    }
    async createPaymentIntent(amount, currency = 'PHP', description) {
        try {
            const response = await fetch(`${this.baseUrl}/payment_intents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            amount: Math.round(amount * 100),
                            currency,
                            description: description || 'Badminton Court Booking',
                        },
                    },
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error creating payment intent:', error);
            throw error;
        }
    }
    async createPaymentSource(paymentIntentId, type = 'gcash') {
        try {
            const response = await fetch(`${this.baseUrl}/sources`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            type,
                            amount: 0,
                            currency: 'PHP',
                            redirect: {
                                success: `${this.configService.get('FRONTEND_URL')}/payment/success`,
                                failed: `${this.configService.get('FRONTEND_URL')}/payment/failed`,
                            },
                        },
                    },
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error creating payment source:', error);
            throw error;
        }
    }
    async attachPaymentSource(paymentIntentId, sourceId) {
        try {
            const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}/attach`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            source: {
                                id: sourceId,
                                type: 'source',
                            },
                        },
                    },
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error attaching payment source:', error);
            throw error;
        }
    }
    async createCheckoutSession(amount, currency = 'PHP', description) {
        try {
            const paymentIntent = await this.createPaymentIntent(amount, currency, description);
            const source = await this.createPaymentSource(paymentIntent.id);
            const attachedIntent = await this.attachPaymentSource(paymentIntent.id, source.id);
            return {
                paymentIntentId: paymentIntent.id,
                checkoutUrl: source.attributes.redirect.checkout_url,
                clientKey: paymentIntent.attributes.client_key,
            };
        }
        catch (error) {
            this.logger.error('Error creating checkout session:', error);
            throw error;
        }
    }
    async getPaymentIntent(paymentIntentId) {
        try {
            const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error getting payment intent:', error);
            throw error;
        }
    }
};
exports.PayMongoService = PayMongoService;
exports.PayMongoService = PayMongoService = PayMongoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PayMongoService);
//# sourceMappingURL=paymongo.service.js.map