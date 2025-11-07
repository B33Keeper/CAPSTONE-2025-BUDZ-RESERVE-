import { PaymentMethod } from '../entities/payment.entity';
export declare class CreatePaymentDto {
    reservation_id: number;
    amount: number;
    payment_method: PaymentMethod;
    notes?: string;
}
