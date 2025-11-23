import { QueueMatchGameType, QueueMatchTeamPlayer, QueueMatchWinner } from './queue-match.entity';
export declare class QueueMatchHistory {
    id: number;
    userId: number;
    originalId: number;
    gameType: QueueMatchGameType;
    teamA: QueueMatchTeamPlayer[];
    teamB: QueueMatchTeamPlayer[];
    courtId: number | null;
    courtName: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    winner: QueueMatchWinner | null;
    createdAt: Date;
    updatedAt: Date;
    archivedAt: Date;
}
