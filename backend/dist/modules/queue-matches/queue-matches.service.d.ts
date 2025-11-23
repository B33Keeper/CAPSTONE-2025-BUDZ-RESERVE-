import { Repository } from 'typeorm';
import { QueuePlayer } from '../queue-players/entities/queue-player.entity';
import { QueueingCourt } from '../queueing-courts/entities/queueing-court.entity';
import { QueueMatch, QueueMatchStatus } from './entities/queue-match.entity';
import { QueueMatchHistory } from './entities/queue-match-history.entity';
import { GenerateQueueMatchesDto } from './dto/generate-queue-matches.dto';
import { CompleteQueueMatchDto } from './dto/complete-queue-match.dto';
import { CreateQueueMatchDto } from './dto/create-queue-match.dto';
export declare class QueueMatchesService {
    private readonly queueMatchesRepository;
    private readonly queueMatchesHistoryRepository;
    private readonly queuePlayersRepository;
    private readonly queueingCourtsRepository;
    private readonly skillPriority;
    constructor(queueMatchesRepository: Repository<QueueMatch>, queueMatchesHistoryRepository: Repository<QueueMatchHistory>, queuePlayersRepository: Repository<QueuePlayer>, queueingCourtsRepository: Repository<QueueingCourt>);
    generateMatches(dto: GenerateQueueMatchesDto, userId: number): Promise<{
        matchesGenerated: number;
        activeMatches: never[];
        pendingMatches: never[];
        skippedPlayers: number[];
        reason: string;
    } | {
        matchesGenerated: number;
        activeMatches: QueueMatch[];
        pendingMatches: QueueMatch[];
        skippedPlayers: number[];
        reason?: undefined;
    }>;
    findAll(status?: QueueMatchStatus, userId?: number): Promise<QueueMatch[]>;
    createMatch(dto: CreateQueueMatchDto, userId: number): Promise<QueueMatch>;
    completeMatch(id: number, dto: CompleteQueueMatchDto, userId: number): Promise<QueueMatch>;
    private activatePendingMatches;
    cancelMatch(id: number, userId: number): Promise<QueueMatch>;
    clearPendingMatches(userId: number): Promise<{
        cleared: number;
    }>;
    private resetExistingMatches;
    private resetPlayersFromMatch;
    private updatePlayersStatus;
    private toISODate;
    private getTodayISODate;
    private getTodayDateRange;
    private isEligibleForGameType;
    private buildTeams;
    private buildSameSexTeams;
    private buildMixedTeams;
    private buildMatchesFromTeams;
    private getTeamSignature;
    private getPlayerPairSignatureFromPlayers;
    private buildPlayerCombinations;
    private getTeamMembersIdSignature;
    findHistory(userId: number): Promise<QueueMatchHistory[]>;
    private matchHasBusyPlayer;
    private toMatchPlayer;
}
