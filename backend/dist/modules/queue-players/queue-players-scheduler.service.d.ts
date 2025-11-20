import { Repository } from 'typeorm';
import { QueuePlayer } from './entities/queue-player.entity';
export declare class QueuePlayersSchedulerService {
    private readonly queuePlayersRepository;
    private readonly logger;
    constructor(queuePlayersRepository: Repository<QueuePlayer>);
    handleDailyPlayerCleanup(): Promise<void>;
    manualCleanup(): Promise<{
        message: string;
        oldPlayersCount: number;
        oldPlayers: QueuePlayer[];
    }>;
    deleteOldPlayers(daysToKeep?: number): Promise<number>;
}
