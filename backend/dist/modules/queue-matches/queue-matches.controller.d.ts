import { QueueMatchesService } from './queue-matches.service';
import { GenerateQueueMatchesDto } from './dto/generate-queue-matches.dto';
import { QueueMatchStatus } from './entities/queue-match.entity';
import { CompleteQueueMatchDto } from './dto/complete-queue-match.dto';
import { CreateQueueMatchDto } from './dto/create-queue-match.dto';
export declare class QueueMatchesController {
    private readonly queueMatchesService;
    constructor(queueMatchesService: QueueMatchesService);
    generate(dto: GenerateQueueMatchesDto, req: any): Promise<{
        matchesGenerated: number;
        activeMatches: never[];
        pendingMatches: never[];
        skippedPlayers: number[];
        reason: string;
    } | {
        matchesGenerated: number;
        activeMatches: import("./entities/queue-match.entity").QueueMatch[];
        pendingMatches: import("./entities/queue-match.entity").QueueMatch[];
        skippedPlayers: number[];
        reason?: undefined;
    }>;
    create(dto: CreateQueueMatchDto, req: any): Promise<import("./entities/queue-match.entity").QueueMatch>;
    findAll(status?: QueueMatchStatus, req?: any): Promise<import("./entities/queue-match.entity").QueueMatch[]>;
    findHistory(req: any): Promise<import("./entities/queue-match-history.entity").QueueMatchHistory[]>;
    complete(id: number, body: CompleteQueueMatchDto, req: any): Promise<import("./entities/queue-match.entity").QueueMatch>;
    cancel(id: number, req: any): Promise<import("./entities/queue-match.entity").QueueMatch>;
    clearPending(req: any): Promise<{
        cleared: number;
    }>;
}
