import { User } from '../../users/entities/user.entity';
import { Court } from '../../courts/entities/court.entity';
import { Payment } from '../../payments/entities/payment.entity';
export declare enum ReservationStatus {
    PENDING = "Pending",
    CONFIRMED = "Confirmed",
    CANCELLED = "Cancelled",
    COMPLETED = "Completed"
}
export declare class Reservation {
    Reservation_ID: number;
    User_ID: number;
    Court_ID: number;
    Reservation_Date: Date;
    Start_Time: string;
    End_Time: string;
    Status: ReservationStatus;
    Total_Amount: number;
    Reference_Number: string;
    Paymongo_Reference_Number: string;
    Notes: string;
    Is_Admin_Created: boolean;
    Created_at: Date;
    Updated_at: Date;
    user: User;
    court: Court;
    payments: Payment[];
}
