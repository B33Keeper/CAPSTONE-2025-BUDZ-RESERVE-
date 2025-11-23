import { Repository } from 'typeorm';
import { QueueingCourt } from './entities/queueing-court.entity';
import { QueueMatch } from '../queue-matches/entities/queue-match.entity';
import { CreateQueueingCourtDto } from './dto/create-queueing-court.dto';
export declare class QueueingCourtsService {
    private readonly queueingCourtsRepository;
    private readonly queueMatchesRepository;
    constructor(queueingCourtsRepository: Repository<QueueingCourt>, queueMatchesRepository: Repository<QueueMatch>);
    create(createQueueingCourtDto: CreateQueueingCourtDto): Promise<QueueingCourt>;
    findAll(): Promise<QueueingCourt[]>;
    remove(id: number): Promise<void>;
    removeAll(): Promise<void>;
}
