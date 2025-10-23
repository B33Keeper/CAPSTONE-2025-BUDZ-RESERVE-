import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
interface PaymentReceiptData {
    paymentId: string;
    amount: number;
    currency: string;
    description: string;
    status: string;
    paidAt?: Date;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    billingAddress: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    paymentMethod: {
        type: string;
        last4?: string;
        exp_month?: number;
        exp_year?: number;
    };
    fee: number;
    netAmount: number;
    referenceNumber?: string;
    reservationDetails?: {
        courtName: string;
        date: string;
        timeSlot: string;
        duration: number;
    };
}
export declare class EmailReceiptService {
    private readonly mailerService;
    private readonly configService;
    private readonly logger;
    constructor(mailerService: MailerService, configService: ConfigService);
    sendPaymentReceipt(paymentData: PaymentReceiptData): Promise<boolean>;
    private getPaymentMethodDisplayName;
    sendPaymentConfirmation(paymentData: PaymentReceiptData): Promise<boolean>;
}
export {};
