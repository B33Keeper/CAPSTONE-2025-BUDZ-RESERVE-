import { Reservation } from '../../reservations/entities/reservation.entity';
export declare enum PaymentMethod {
    GCASH = "GCash",
    MAYA = "Maya",
    GRABPAY = "GrabPay",
    BANKING = "Online Banking",
    CASH = "Cash",
    QRPH = "QR Ph"
}
export declare enum PaymentStatus {
    PENDING = "Pending",
    COMPLETED = "Completed",
    FAILED = "Failed",
    CANCELLED = "Cancelled"
}
export declare class Payment {
    id: number;
    reservation_id: number;
    amount: number;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    transaction_id: string;
    reference_number: string;
    notes: string;
    created_at: Date;
    updated_at: Date;
    reservation: Reservation;
}
