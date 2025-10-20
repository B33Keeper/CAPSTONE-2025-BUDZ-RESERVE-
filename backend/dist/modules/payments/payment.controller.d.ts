import { PayMongoService } from './paymongo.service';
export declare class PaymentController {
    private readonly payMongoService;
    private readonly logger;
    constructor(payMongoService: PayMongoService);
    createCheckout(body: {
        amount: number;
        description?: string;
    }): Promise<{
        success: boolean;
        data: {
            paymentIntentId: any;
            checkoutUrl: any;
            clientKey: any;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    getPaymentStatus(paymentIntentId: string): Promise<{
        success: boolean;
        data: any;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
}
