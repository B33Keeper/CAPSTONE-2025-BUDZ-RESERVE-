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
        this.secretKey = 'sk_test_gR6gPcDcqGdwXnSDjvyMipRH';
        this.publicKey = 'pk_test_wqL9TDyzi8VqZ8wz96qZQNYm';
    }
    async createPaymentIntent(amount, currency = 'PHP', description, metadata) {
        try {
            const response = await fetch(`${this.baseUrl}/payment_intents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            amount: Math.round(amount * 100),
                            payment_method_allowed: ['card', 'paymaya', 'gcash', 'grab_pay'],
                            payment_method_options: {
                                card: {
                                    request_three_d_secure: 'any'
                                }
                            },
                            currency,
                            capture_type: 'automatic',
                            description: description || 'Badminton Court Booking',
                            ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {})
                        }
                    }
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
    async getPaymentIntent(paymentIntentId) {
        try {
            const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}?client_key=${this.publicKey}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'accept': 'application/json',
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
    async createPaymentMethod(type, details, billing) {
        try {
            const response = await fetch(`${this.baseUrl}/payment_methods`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            type,
                            details,
                            billing,
                            payment_method_option: type === 'card' ? {
                                card: {
                                    installments: {
                                        plan: {
                                            issuer_id: 'string',
                                            tenure: 0
                                        }
                                    }
                                }
                            } : undefined
                        }
                    }
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error creating payment method:', error);
            throw error;
        }
    }
    async getPaymentMethod(paymentMethodId) {
        try {
            const response = await fetch(`${this.baseUrl}/payment_methods/${paymentMethodId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'accept': 'application/json',
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error getting payment method:', error);
            throw error;
        }
    }
    async getCheckoutSession(checkoutSessionId) {
        try {
            const response = await fetch(`${this.baseUrl}/checkout_sessions/${checkoutSessionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'accept': 'application/json',
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error getting checkout session:', error);
            throw error;
        }
    }
    async attachPaymentMethod(paymentIntentId, paymentMethodId, returnUrl) {
        try {
            const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}/attach`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            payment_method: paymentMethodId,
                            client_key: this.publicKey,
                            return_url: returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success`
                        }
                    }
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error attaching payment method:', error);
            throw error;
        }
    }
    async getPayment(paymentId) {
        try {
            const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'accept': 'application/json',
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error getting payment:', error);
            throw error;
        }
    }
    async listPayments(limit = 10) {
        try {
            const response = await fetch(`${this.baseUrl}/payments?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'accept': 'application/json',
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            return result.data;
        }
        catch (error) {
            this.logger.error('Error listing payments:', error);
            throw error;
        }
    }
    async processPayment(amount, paymentMethodType, paymentDetails, billingInfo, description, metadata) {
        try {
            const paymentIntent = await this.createPaymentIntent(amount, 'PHP', description, metadata);
            const paymentMethod = await this.createPaymentMethod(paymentMethodType, paymentDetails, billingInfo);
            const attachedIntent = await this.attachPaymentMethod(paymentIntent.id, paymentMethod.id);
            return {
                paymentIntent: attachedIntent,
                paymentMethod,
                clientKey: paymentIntent.attributes.client_key,
                publicKey: this.publicKey
            };
        }
        catch (error) {
            this.logger.error('Error processing payment:', error);
            throw error;
        }
    }
    async createPaymentSource(amount, currency = 'PHP', type = 'gcash', returnUrl) {
        try {
            const response = await fetch(`${this.baseUrl}/sources`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            type,
                            amount: Math.round(amount * 100),
                            currency,
                            redirect: {
                                success: returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success`,
                                failed: returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/failed`,
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
                    'accept': 'application/json',
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
            return {
                paymentIntentId: paymentIntent.id,
                clientKey: paymentIntent.attributes.client_key,
                publicKey: this.publicKey,
                amount: paymentIntent.attributes.amount,
                currency: paymentIntent.attributes.currency,
                status: paymentIntent.attributes.status
            };
        }
        catch (error) {
            this.logger.error('Error creating checkout session:', error);
            throw error;
        }
    }
    async createCheckoutSessionWithRedirect(amount, currency = 'PHP', description, returnUrl) {
        try {
            const paymentIntent = await this.createPaymentIntent(amount, currency, description);
            const source = await this.createPaymentSource(amount, currency, 'gcash', returnUrl);
            return {
                paymentIntentId: paymentIntent.id,
                clientKey: paymentIntent.attributes.client_key,
                publicKey: this.publicKey,
                amount: paymentIntent.attributes.amount,
                currency: paymentIntent.attributes.currency,
                status: paymentIntent.attributes.status,
                checkoutUrl: source.attributes.redirect.checkout_url
            };
        }
        catch (error) {
            this.logger.error('Error creating checkout session with redirect:', error);
            throw error;
        }
    }
    async createPaymongoCheckout(amount, currency = 'PHP', description, returnUrl, billingInfo, bookingData) {
        try {
            const lineItems = [];
            if (bookingData?.courtBookings?.length) {
                const courtTotal = bookingData.courtBookings.reduce((sum, b) => sum + Number(b.subtotal || 0), 0);
                lineItems.push({
                    currency,
                    amount: Math.round(courtTotal * 100),
                    description: 'Court Reservation',
                    name: 'Court Reservation',
                    quantity: 1,
                });
            }
            if (bookingData?.equipmentBookings?.length) {
                for (const eq of bookingData.equipmentBookings) {
                    const eqSubtotal = Number(eq.subtotal || 0);
                    const qty = Number(eq.quantity || 1);
                    const unit = qty > 0 ? Math.round((eqSubtotal / qty) * 100) : Math.round(eqSubtotal * 100);
                    if (eqSubtotal > 0) {
                        lineItems.push({
                            currency,
                            amount: unit,
                            description: `Rent: ${eq.equipment} (${eq.time || '1 hr'})`,
                            name: `Rent: ${eq.equipment}`,
                            quantity: qty,
                        });
                    }
                }
            }
            const response = await fetch(`${this.baseUrl}/checkout_sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            billing: billingInfo || {
                                name: 'Customer',
                                email: 'customer@example.com',
                                phone: '09123456789'
                            },
                            line_items: (lineItems.length > 0 ? lineItems : [
                                {
                                    currency: currency,
                                    amount: Math.round(amount * 100),
                                    description: description || 'Badminton Court Booking',
                                    name: 'Court Reservation',
                                    quantity: 1,
                                }
                            ]),
                            payment_method_types: ['gcash', 'grab_pay', 'paymaya', 'card'],
                            send_email_receipt: true,
                            show_description: true,
                            show_line_items: true,
                            cancel_url: returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/booking`,
                            success_url: bookingData ?
                                `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success?checkout_session_id={CHECKOUT_SESSION_ID}&amount=${amount}&bookingData=${encodeURIComponent(JSON.stringify(bookingData))}` :
                                (returnUrl || `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/success`),
                            reference_number: `REF${Date.now()}`,
                            description: description || 'Badminton Court Booking',
                            metadata: bookingData ? {
                                bookingData: JSON.stringify(bookingData)
                            } : {}
                        }
                    }
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(`PayMongo API error: ${result.errors?.[0]?.detail || 'Unknown error'}`);
            }
            console.log('Paymongo checkout session response:', JSON.stringify(result, null, 2));
            const checkoutSessionId = result.data.id;
            console.log('Generated checkout session ID:', checkoutSessionId);
            const checkoutUrl = result.data.attributes.checkout_url;
            console.log('Checkout URL:', checkoutUrl);
            if (bookingData) {
                console.log('Storing checkout session ID in metadata for later retrieval');
            }
            return {
                checkoutSessionId: checkoutSessionId,
                checkoutUrl: checkoutUrl,
                clientKey: result.data.attributes.client_key,
                publicKey: this.publicKey,
                amount: result.data.attributes.payment_intent.attributes.amount,
                currency: result.data.attributes.payment_intent.attributes.currency,
                status: result.data.attributes.status,
                paymentMethodTypes: result.data.attributes.payment_method_types,
                referenceNumber: result.data.attributes.reference_number
            };
        }
        catch (error) {
            this.logger.error('Error creating Paymongo checkout session:', error);
            throw error;
        }
    }
    async createCheckoutSessionWithSource(amount, currency = 'PHP', description, returnUrl) {
        try {
            const paymentIntent = await this.createPaymentIntent(amount, currency, description);
            const source = await this.createPaymentSource(amount, currency, 'gcash', returnUrl);
            const attachedIntent = await this.attachPaymentSource(paymentIntent.id, source.id);
            return {
                paymentIntentId: paymentIntent.id,
                checkoutUrl: source.attributes.redirect.checkout_url,
                clientKey: paymentIntent.attributes.client_key,
                publicKey: this.publicKey,
                amount: paymentIntent.attributes.amount,
                currency: paymentIntent.attributes.currency,
                status: paymentIntent.attributes.status
            };
        }
        catch (error) {
            this.logger.error('Error creating checkout session with source:', error);
            throw error;
        }
    }
    async generateQrPhStaticCode(params) {
        const { mobileNumber, notes, kind = 'instore' } = params || {};
        try {
            const response = await fetch(`${this.baseUrl}/qrph/generate`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        attributes: {
                            kind,
                            ...(mobileNumber ? { mobile_number: mobileNumber } : {}),
                            ...(notes ? { notes } : {}),
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
            this.logger.error('Error generating QR Ph static code:', error);
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