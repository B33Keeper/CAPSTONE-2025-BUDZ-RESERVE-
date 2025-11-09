import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Payment } from '../payments/entities/payment.entity';
import { EquipmentRental } from '../payments/entities/equipment-rental.entity';
import { EquipmentRentalItem } from '../payments/entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { User } from '../users/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CourtsService } from '../courts/courts.service';
import { EquipmentService } from '../equipment/equipment.service';
import { PayMongoService } from '../payments/paymongo.service';
export declare class ReservationsService {
    private reservationsRepository;
    private paymentRepository;
    private equipmentRentalRepository;
    private equipmentRentalItemRepository;
    private equipmentRepository;
    private userRepository;
    private courtsService;
    private equipmentService;
    private payMongoService;
    constructor(reservationsRepository: Repository<Reservation>, paymentRepository: Repository<Payment>, equipmentRentalRepository: Repository<EquipmentRental>, equipmentRentalItemRepository: Repository<EquipmentRentalItem>, equipmentRepository: Repository<Equipment>, userRepository: Repository<User>, courtsService: CourtsService, equipmentService: EquipmentService, payMongoService: PayMongoService);
    create(createReservationDto: CreateReservationDto, userId: number): Promise<Reservation>;
    findAll(): Promise<Reservation[]>;
    findByUser(userId: number): Promise<Reservation[]>;
    findOne(id: number): Promise<Reservation>;
    update(id: number, updateReservationDto: UpdateReservationDto): Promise<Reservation>;
    remove(id: number): Promise<void>;
    getAvailability(courtId: number, date: string): Promise<any[]>;
    createFromPayment(paymentData: any): Promise<Reservation[]>;
    private parseScheduleToTimes;
    private convertTo24Hour;
    private createPaymentRecord;
    private mapPaymentMethod;
    checkDuplicateReservation(userId: number, courtId: number, date: string, startTime: string, endTime: string): Promise<{
        isDuplicate: boolean;
        message?: string;
    }>;
    private getOrCreateGuestUser;
    createWithCashPayment(customerName: string, bookingData: any): Promise<{
        reservations: Reservation[];
        payment: Payment;
    }>;
    private createEquipmentRentalsFromBooking;
    private parseHours;
}
