import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReservationsService } from '../reservations/reservations.service';
export declare class PaymentsService {
    private paymentsRepository;
    private reservationsService;
    constructor(paymentsRepository: Repository<Payment>, reservationsService: ReservationsService);
    create(createPaymentDto: CreatePaymentDto): Promise<Payment>;
    findAll(): Promise<Payment[]>;
    findOne(id: number): Promise<Payment>;
    findByReservation(reservationId: number): Promise<Payment[]>;
    updateStatus(id: number, status: string): Promise<Payment>;
}
