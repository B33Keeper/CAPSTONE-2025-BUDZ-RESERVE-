import { ConfigService } from '@nestjs/config';
export declare class PayMongoService {
    private configService;
    private readonly logger;
    private readonly secretKey;
    private readonly publicKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    createPaymentIntent(amount: number, currency?: string, description?: string): Promise<any>;
    createPaymentSource(paymentIntentId: string, type?: string): Promise<any>;
    attachPaymentSource(paymentIntentId: string, sourceId: string): Promise<any>;
    createCheckoutSession(amount: number, currency?: string, description?: string): Promise<{
        paymentIntentId: any;
        checkoutUrl: any;
        clientKey: any;
    }>;
    getPaymentIntent(paymentIntentId: string): Promise<any>;
}
