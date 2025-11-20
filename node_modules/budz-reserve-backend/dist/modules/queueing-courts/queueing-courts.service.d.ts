import { Repository } from 'typeorm';
import { QueueingCourt } from './entities/queueing-court.entity';
import { CreateQueueingCourtDto } from './dto/create-queueing-court.dto';
export declare class QueueingCourtsService {
    private readonly queueingCourtsRepository;
    constructor(queueingCourtsRepository: Repository<QueueingCourt>);
    create(createQueueingCourtDto: CreateQueueingCourtDto): Promise<QueueingCourt>;
    findAll(): Promise<QueueingCourt[]>;
    remove(id: number): Promise<void>;
    removeAll(): Promise<void>;
}
