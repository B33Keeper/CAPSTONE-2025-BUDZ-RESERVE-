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
        customerEmail?: string;
        customerContact?: string;
        bookingData: any;
    }, req: any): Promise<{
        reservations: import("./entities/reservation.entity").Reservation[];
        payment: import("../payments/entities/payment.entity").Payment;
    }>;
    generateQrPhPreview(body: {
        customerName: string;
        customerEmail?: string;
        customerContact?: string;
        qrDetails?: {
            notes?: string;
            mobileNumber?: string;
            kind?: 'instore' | 'dynamic' | string;
        };
    }): Promise<{
        qrData: import("../payments/types/paymongo.types").PaymongoQrPhCode;
    }>;
    createWithQrPh(body: {
        customerName: string;
        customerEmail?: string;
        customerContact?: string;
        bookingData: any;
        qrDetails?: {
            notes?: string;
            mobileNumber?: string;
            kind?: 'instore' | 'dynamic' | string;
        };
        existingQrData?: any;
    }, req: any): Promise<{
        reservations: import("./entities/reservation.entity").Reservation[];
        payment: import("../payments/entities/payment.entity").Payment;
        qrData: import("../payments/types/paymongo.types").PaymongoQrPhCode;
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
