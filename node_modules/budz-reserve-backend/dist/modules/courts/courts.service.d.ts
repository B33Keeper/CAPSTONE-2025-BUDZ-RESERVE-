import { Repository } from 'typeorm';
import { Court } from './entities/court.entity';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
export declare class CourtsService {
    private courtsRepository;
    constructor(courtsRepository: Repository<Court>);
    create(createCourtDto: CreateCourtDto): Promise<Court>;
    findAll(): Promise<Court[]>;
    findOne(id: number): Promise<Court>;
    update(id: number, updateCourtDto: UpdateCourtDto): Promise<Court>;
    remove(id: number): Promise<void>;
    getAvailableCourts(): Promise<Court[]>;
}
