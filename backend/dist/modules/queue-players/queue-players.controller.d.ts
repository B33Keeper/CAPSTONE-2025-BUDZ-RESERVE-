import { QueuePlayersService } from './queue-players.service';
import { QueuePlayersSchedulerService } from './queue-players-scheduler.service';
import { CreateQueuePlayerDto } from './dto/create-queue-player.dto';
import { QueuePlayer } from './entities/queue-player.entity';
import { UpdateQueuePlayerDto } from './dto/update-queue-player.dto';
export declare class QueuePlayersController {
    private readonly queuePlayersService;
    private readonly schedulerService;
    constructor(queuePlayersService: QueuePlayersService, schedulerService: QueuePlayersSchedulerService);
    findAll(req: any): Promise<QueuePlayer[]>;
    findHistory(req: any): Promise<import("./entities/queue-player-history.entity").QueuePlayerHistory[]>;
    migratePlayers(req: any): Promise<{
        message: string;
        migratedCount: number;
    }>;
    create(dto: CreateQueuePlayerDto, req: any): Promise<QueuePlayer>;
    update(id: number, dto: UpdateQueuePlayerDto, req: any): Promise<QueuePlayer>;
    manualCleanup(): Promise<{
        message: string;
        oldPlayersCount: number;
        movedToHistory: number;
        oldPlayers: QueuePlayer[];
    }>;
    savePlayersToHistory(req: any): Promise<{
        message: string;
        savedCount: number;
        players: QueuePlayer[];
    }>;
    clearHistory(req: any): Promise<{
        message: string;
        deletedCount: number;
        historyTableDeletedCount: number;
    }>;
    deleteOldPlayers(days?: string): Promise<{
        message: string;
        deletedCount: number;
    }>;
    remove(id: number, req: any): Promise<void>;
}
