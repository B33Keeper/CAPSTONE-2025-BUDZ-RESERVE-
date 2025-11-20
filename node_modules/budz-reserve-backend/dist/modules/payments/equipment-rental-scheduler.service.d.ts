import { Repository } from 'typeorm';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
export declare class EquipmentRentalSchedulerService {
    private readonly rentalItemRepository;
    private readonly rentalRepository;
    private readonly equipmentRepository;
    private readonly reservationRepository;
    private readonly logger;
    constructor(rentalItemRepository: Repository<EquipmentRentalItem>, rentalRepository: Repository<EquipmentRental>, equipmentRepository: Repository<Equipment>, reservationRepository: Repository<Reservation>);
    handleExpiredRentalRestoration(): Promise<void>;
    manualRestoreExpiredRentals(): Promise<{
        message: string;
        restoredCount: number;
    }>;
}
