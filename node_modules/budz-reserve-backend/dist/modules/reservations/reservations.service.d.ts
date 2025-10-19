import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CourtsService } from '../courts/courts.service';
import { EquipmentService } from '../equipment/equipment.service';
export declare class ReservationsService {
    private reservationsRepository;
    private courtsService;
    private equipmentService;
    constructor(reservationsRepository: Repository<Reservation>, courtsService: CourtsService, equipmentService: EquipmentService);
    create(createReservationDto: CreateReservationDto, userId: number): Promise<Reservation>;
    findAll(): Promise<Reservation[]>;
    findByUser(userId: number): Promise<Reservation[]>;
    findOne(id: number): Promise<Reservation>;
    update(id: number, updateReservationDto: UpdateReservationDto): Promise<Reservation>;
    remove(id: number): Promise<void>;
    getAvailability(courtId: number, date: string): Promise<any[]>;
}
