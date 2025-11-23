import { Repository } from 'typeorm';
import { Court } from './entities/court.entity';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { Reservation } from '../reservations/entities/reservation.entity';
export declare class CourtsService {
    private courtsRepository;
    private reservationsRepository;
    constructor(courtsRepository: Repository<Court>, reservationsRepository: Repository<Reservation>);
    create(createCourtDto: CreateCourtDto): Promise<Court>;
    findAll(): Promise<Court[]>;
    findOne(id: number): Promise<Court>;
    update(id: number, updateCourtDto: UpdateCourtDto): Promise<Court>;
    remove(id: number): Promise<void>;
    getAvailableCourts(): Promise<Court[]>;
    getCourtCount(): Promise<number>;
    getAvailableCourtCount(): Promise<number>;
}
