import { ConfigService } from '@nestjs/config';
import { PaymongoPaymentIntent, PaymongoPaymentMethod, PaymongoPayment, PaymongoQrPhCode } from './types/paymongo.types';
export declare class PayMongoService {
    private configService;
    private readonly logger;
    private readonly secretKey;
    private readonly publicKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    createPaymentIntent(amount: number, currency?: string, description?: string, metadata?: any): Promise<PaymongoPaymentIntent>;
    getPaymentIntent(paymentIntentId: string): Promise<PaymongoPaymentIntent>;
    createPaymentMethod(type: 'card' | 'gcash' | 'paymaya' | 'grab_pay', details: any, billing: {
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
    }): Promise<PaymongoPaymentMethod>;
    getPaymentMethod(paymentMethodId: string): Promise<PaymongoPaymentMethod>;
    getCheckoutSession(checkoutSessionId: string): Promise<any>;
    attachPaymentMethod(paymentIntentId: string, paymentMethodId: string, returnUrl?: string): Promise<PaymongoPaymentIntent>;
    getPayment(paymentId: string): Promise<PaymongoPayment>;
    listPayments(limit?: number): Promise<PaymongoPayment[]>;
    processPayment(amount: number, paymentMethodType: 'card' | 'gcash' | 'paymaya' | 'grab_pay', paymentDetails: any, billingInfo: {
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
    }, description?: string, metadata?: any): Promise<{
        paymentIntent: PaymongoPaymentIntent;
        paymentMethod: PaymongoPaymentMethod;
        clientKey: string;
        publicKey: string;
    }>;
    createPaymentSource(amount: number, currency?: string, type?: string, returnUrl?: string): Promise<any>;
    attachPaymentSource(paymentIntentId: string, sourceId: string): Promise<any>;
    createCheckoutSession(amount: number, currency?: string, description?: string): Promise<{
        paymentIntentId: string;
        clientKey: string;
        publicKey: string;
        amount: number;
        currency: string;
        status: "awaiting_payment_method" | "awaiting_next_action" | "processing" | "succeeded" | "awaiting_payment";
    }>;
    createCheckoutSessionWithRedirect(amount: number, currency?: string, description?: string, returnUrl?: string): Promise<{
        paymentIntentId: string;
        clientKey: string;
        publicKey: string;
        amount: number;
        currency: string;
        status: "awaiting_payment_method" | "awaiting_next_action" | "processing" | "succeeded" | "awaiting_payment";
        checkoutUrl: any;
    }>;
    createPaymongoCheckout(amount: number, currency?: string, description?: string, returnUrl?: string, billingInfo?: any, bookingData?: any): Promise<{
        checkoutSessionId: any;
        checkoutUrl: any;
        clientKey: any;
        publicKey: string;
        amount: any;
        currency: any;
        status: any;
        paymentMethodTypes: any;
        referenceNumber: any;
    }>;
    createCheckoutSessionWithSource(amount: number, currency?: string, description?: string, returnUrl?: string): Promise<{
        paymentIntentId: string;
        checkoutUrl: any;
        clientKey: string;
        publicKey: string;
        amount: number;
        currency: string;
        status: "awaiting_payment_method" | "awaiting_next_action" | "processing" | "succeeded" | "awaiting_payment";
    }>;
    generateQrPhStaticCode(params: {
        mobileNumber?: string;
        notes?: string;
        kind?: 'instore' | 'dynamic' | string;
    }): Promise<PaymongoQrPhCode>;
}
