import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
export declare class ReservationsController {
    private readonly reservationsService;
    constructor(reservationsService: ReservationsService);
    create(createReservationDto: CreateReservationDto, req: any): Promise<import("./entities/reservation.entity").Reservation>;
    createFromPayment(paymentData: any): Promise<import("./entities/reservation.entity").Reservation[]>;
    findAll(): Promise<import("./entities/reservation.entity").Reservation[]>;
    findMyReservations(req: any): Promise<import("./entities/reservation.entity").Reservation[]>;
    getAvailability(courtId: number, date: string): Promise<any[]>;
    findOne(id: number): Promise<import("./entities/reservation.entity").Reservation>;
    update(id: number, updateReservationDto: UpdateReservationDto): Promise<import("./entities/reservation.entity").Reservation>;
    remove(id: number): Promise<void>;
}
