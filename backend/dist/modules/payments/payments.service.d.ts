import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
export declare class PaymentsService {
    private paymentsRepository;
    private reservationsRepository;
    private equipmentRentalRepository;
    private equipmentRentalItemRepository;
    private equipmentRepository;
    private reservationsService;
    constructor(paymentsRepository: Repository<Payment>, reservationsRepository: Repository<Reservation>, equipmentRentalRepository: Repository<EquipmentRental>, equipmentRentalItemRepository: Repository<EquipmentRentalItem>, equipmentRepository: Repository<Equipment>, reservationsService: ReservationsService);
    create(createPaymentDto: CreatePaymentDto): Promise<Payment>;
    findAll(): Promise<Payment[]>;
    findOne(id: number): Promise<Payment>;
    findByReservation(reservationId: number): Promise<Payment[]>;
    updateStatus(id: number, status: string): Promise<Payment>;
    getSalesReport(startDate: Date, endDate: Date): Promise<{
        data: {
            reservationId: number;
            customerName: string;
            courtName: string;
            time: string;
            date: string;
            paymentMethod: import("./entities/payment.entity").PaymentMethod;
            price: number;
            status: string;
            equipmentRentals: any[];
        }[];
        summary: {
            totalReservations: number;
            totalIncome: number;
            totalCancellations: number;
        };
    }>;
}
