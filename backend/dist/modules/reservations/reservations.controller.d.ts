import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
export declare class ReservationsController {
    private readonly reservationsService;
    constructor(reservationsService: ReservationsService);
    create(createReservationDto: CreateReservationDto, req: any): Promise<import("./entities/reservation.entity").Reservation>;
    createFromPayment(paymentData: any): Promise<import("./entities/reservation.entity").Reservation[]>;
    createWithCash(body: {
        customerName: string;
        bookingData: any;
    }, req: any): Promise<{
        reservations: import("./entities/reservation.entity").Reservation[];
        payment: import("../payments/entities/payment.entity").Payment;
    }>;
    findAll(): Promise<import("./entities/reservation.entity").Reservation[]>;
    findMyReservations(req: any): Promise<import("./entities/reservation.entity").Reservation[]>;
    getAvailability(courtId: number, date: string): Promise<any[]>;
    checkDuplicate(checkDto: {
        courtId: number;
        date: string;
        startTime: string;
        endTime: string;
    }, req: any): Promise<{
        isDuplicate: boolean;
        message?: string;
    }>;
    findOne(id: number): Promise<import("./entities/reservation.entity").Reservation>;
    update(id: number, updateReservationDto: UpdateReservationDto): Promise<import("./entities/reservation.entity").Reservation>;
    remove(id: number): Promise<void>;
}
