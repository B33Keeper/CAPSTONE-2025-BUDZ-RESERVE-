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
import { PaymongoQrPhCode } from '../payments/types/paymongo.types';
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
    getEquipmentAvailabilityByDate(dateInput: string, startTime?: string, hoursParam?: number): Promise<{
        id: number;
        equipment_name: string;
        image_path: string;
        price: number;
        total_stocks: number;
        reserved: number;
        available: number;
        status: string;
    }[]>;
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
    createWithCashPayment(customerName: string, bookingData: any, customerContact?: string, customerEmail?: string): Promise<{
        reservations: Reservation[];
        payment: Payment;
    }>;
    generateQrPhPreview(customerName: string, qrDetails?: {
        notes?: string;
        mobileNumber?: string;
        kind?: 'instore' | 'dynamic' | string;
    }): Promise<{
        qrData: PaymongoQrPhCode;
    }>;
    createWithQrPhPayment(customerName: string, bookingData: any, customerContact?: string, customerEmail?: string, qrDetails?: {
        notes?: string;
        mobileNumber?: string;
        kind?: 'instore' | 'dynamic' | string;
    }, existingQrData?: PaymongoQrPhCode): Promise<{
        reservations: Reservation[];
        payment: Payment;
        qrData: PaymongoQrPhCode;
    }>;
    private createWalkInReservationsAndRentals;
    private buildCustomerDetailsNote;
    private formatDateOnly;
    private getReservedQuantityForRange;
    private ensureEquipmentAvailabilityForDate;
    private createEquipmentRentalsFromBooking;
    private ensureTimeFormat;
    private timeStringToMinutes;
    private timeRangesOverlap;
    private compareScheduleStartTimes;
    private getEarliestStartTimeFromBookings;
    private parseHours;
}
