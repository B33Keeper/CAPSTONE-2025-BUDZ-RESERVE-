import { Repository } from 'typeorm';
import { TimeSlot } from './entities/time-slot.entity';
export declare class TimeSlotsService {
    private timeSlotsRepository;
    constructor(timeSlotsRepository: Repository<TimeSlot>);
    findAll(): Promise<TimeSlot[]>;
    findOne(id: number): Promise<TimeSlot | null>;
}
