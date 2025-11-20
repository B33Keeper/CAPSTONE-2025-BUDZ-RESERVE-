import { QueuePlayersService } from './queue-players.service';
import { QueuePlayersSchedulerService } from './queue-players-scheduler.service';
import { CreateQueuePlayerDto } from './dto/create-queue-player.dto';
import { QueuePlayer } from './entities/queue-player.entity';
import { UpdateQueuePlayerDto } from './dto/update-queue-player.dto';
export declare class QueuePlayersController {
    private readonly queuePlayersService;
    private readonly schedulerService;
    constructor(queuePlayersService: QueuePlayersService, schedulerService: QueuePlayersSchedulerService);
    findAll(): Promise<QueuePlayer[]>;
    create(dto: CreateQueuePlayerDto): Promise<QueuePlayer>;
    update(id: number, dto: UpdateQueuePlayerDto): Promise<QueuePlayer>;
    remove(id: number): Promise<void>;
    manualCleanup(): Promise<{
        message: string;
        oldPlayersCount: number;
        oldPlayers: QueuePlayer[];
    }>;
    deleteOldPlayers(days?: string): Promise<{
        message: string;
        deletedCount: number;
    }>;
}
