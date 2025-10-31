import { Repository } from 'typeorm';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { PayMongoService } from './paymongo.service';
import { EmailReceiptService } from './email-receipt.service';
import { PaymentsService } from './payments.service';
import { PaymongoPaymentIntent, PaymongoPaymentMethod, PaymongoPayment } from './types/paymongo.types';
interface CreatePaymentIntentDto {
    amount: number;
    description?: string;
    metadata?: any;
}
interface ProcessPaymentDto {
    amount: number;
    paymentMethodType: 'card' | 'gcash' | 'paymaya' | 'grab_pay';
    paymentDetails: any;
    billingInfo: {
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
    };
    description?: string;
    metadata?: any;
    reservationId?: number;
}
interface AttachPaymentMethodDto {
    paymentIntentId: string;
    paymentMethodId: string;
    returnUrl?: string;
}
export declare class PaymentController {
    private readonly payMongoService;
    private readonly emailReceiptService;
    private readonly paymentsService;
    private readonly rentalRepository;
    private readonly rentalItemRepository;
    private readonly equipmentRepository;
    private readonly logger;
    constructor(payMongoService: PayMongoService, emailReceiptService: EmailReceiptService, paymentsService: PaymentsService, rentalRepository: Repository<EquipmentRental>, rentalItemRepository: Repository<EquipmentRentalItem>, equipmentRepository: Repository<Equipment>);
    createPaymentIntent(body: CreatePaymentIntentDto): Promise<{
        success: boolean;
        data?: PaymongoPaymentIntent;
        message?: string;
    }>;
    getPaymentIntent(paymentIntentId: string): Promise<{
        success: boolean;
        data?: PaymongoPaymentIntent;
        message?: string;
    }>;
    getRentalsByReservation(reservationId: number): Promise<{
        success: boolean;
        data: {
            items: {
                equipmentId: number;
                equipmentName: string;
                quantity: number;
                hours: number;
                hourlyPrice: number;
                subtotal: number;
            }[];
            total: number;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    createPaymentMethod(body: {
        type: 'card' | 'gcash' | 'paymaya' | 'grab_pay';
        details: any;
        billing: {
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
        };
    }): Promise<{
        success: boolean;
        data?: PaymongoPaymentMethod;
        message?: string;
    }>;
    attachPaymentMethod(body: AttachPaymentMethodDto): Promise<{
        success: boolean;
        data?: PaymongoPaymentIntent;
        message?: string;
    }>;
    processPayment(body: ProcessPaymentDto): Promise<{
        success: boolean;
        data: {
            paymentIntent: PaymongoPaymentIntent;
            paymentMethod: PaymongoPaymentMethod;
            clientKey: string;
            publicKey: string;
            savedPayment: import("./entities/payment.entity").Payment | null;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    getPayment(paymentId: string): Promise<{
        success: boolean;
        data?: PaymongoPayment;
        message?: string;
    }>;
    listPayments(limit?: number): Promise<{
        success: boolean;
        data?: PaymongoPayment[];
        message?: string;
    }>;
    createCheckout(body: {
        amount: number;
        description?: string;
    }): Promise<{
        success: boolean;
        data: {
            paymentIntentId: string;
            clientKey: string;
            publicKey: string;
            amount: number;
            currency: string;
            status: "awaiting_payment_method" | "awaiting_next_action" | "processing" | "succeeded" | "awaiting_payment";
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    createCheckoutWithSource(body: {
        amount: number;
        description?: string;
        returnUrl?: string;
    }): Promise<{
        success: boolean;
        data: {
            paymentIntentId: string;
            checkoutUrl: any;
            clientKey: string;
            publicKey: string;
            amount: number;
            currency: string;
            status: "awaiting_payment_method" | "awaiting_next_action" | "processing" | "succeeded" | "awaiting_payment";
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    createCheckoutRedirect(body: {
        amount: number;
        description?: string;
        returnUrl?: string;
    }): Promise<{
        success: boolean;
        data: {
            paymentIntentId: string;
            clientKey: string;
            publicKey: string;
            amount: number;
            currency: string;
            status: "awaiting_payment_method" | "awaiting_next_action" | "processing" | "succeeded" | "awaiting_payment";
            checkoutUrl: any;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    createPaymongoCheckout(body: {
        amount: number;
        description?: string;
        returnUrl?: string;
        billingInfo?: {
            name: string;
            email: string;
            phone: string;
        };
        bookingData?: string;
    }): Promise<{
        success: boolean;
        data: {
            checkoutSessionId: any;
            checkoutUrl: any;
            clientKey: any;
            publicKey: string;
            amount: any;
            currency: any;
            status: any;
            paymentMethodTypes: any;
            referenceNumber: any;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    getPaymentStatus(paymentIntentId: string): Promise<{
        success: boolean;
        data?: PaymongoPaymentIntent;
        message?: string;
    }>;
    getReceipt(paymentId: string): Promise<{
        success: boolean;
        data?: any;
        message?: string;
    }>;
}
export {};
