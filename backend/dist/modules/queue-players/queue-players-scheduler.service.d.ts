import { Repository } from 'typeorm';
import { QueuePlayer } from './entities/queue-player.entity';
import { QueuePlayerHistory } from './entities/queue-player-history.entity';
export declare class QueuePlayersSchedulerService {
    private readonly queuePlayersRepository;
    private readonly queuePlayersHistoryRepository;
    private readonly logger;
    constructor(queuePlayersRepository: Repository<QueuePlayer>, queuePlayersHistoryRepository: Repository<QueuePlayerHistory>);
    handleDailyPlayerCleanup(): Promise<void>;
    manualCleanup(): Promise<{
        message: string;
        oldPlayersCount: number;
        movedToHistory: number;
        oldPlayers: QueuePlayer[];
    }>;
    deleteOldHistoryRecords(daysToKeep?: number): Promise<number>;
    deleteOldPlayers(daysToKeep?: number): Promise<number>;
    savePlayersToHistory(userId: number): Promise<{
        message: string;
        savedCount: number;
        players: QueuePlayer[];
    }>;
    clearHistory(userId: number): Promise<{
        message: string;
        deletedCount: number;
        historyTableDeletedCount: number;
    }>;
}
