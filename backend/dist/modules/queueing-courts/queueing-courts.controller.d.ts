import { QueueingCourtsService } from './queueing-courts.service';
import { CreateQueueingCourtDto } from './dto/create-queueing-court.dto';
export declare class QueueingCourtsController {
    private readonly queueingCourtsService;
    constructor(queueingCourtsService: QueueingCourtsService);
    create(createQueueingCourtDto: CreateQueueingCourtDto): Promise<import("./entities/queueing-court.entity").QueueingCourt>;
    findAll(): Promise<import("./entities/queueing-court.entity").QueueingCourt[]>;
    removeAll(): Promise<void>;
    remove(id: number): Promise<void>;
}
