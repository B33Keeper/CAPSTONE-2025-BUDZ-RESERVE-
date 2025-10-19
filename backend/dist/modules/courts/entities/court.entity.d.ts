import { Reservation } from '../../reservations/entities/reservation.entity';
export declare enum CourtStatus {
    AVAILABLE = "Available",
    MAINTENANCE = "Maintenance",
    UNAVAILABLE = "Unavailable"
}
export declare class Court {
    Court_Id: number;
    Court_Name: string;
    Status: CourtStatus;
    Price: number;
    Created_at: Date;
    Updated_at: Date;
    reservations: Reservation[];
}
