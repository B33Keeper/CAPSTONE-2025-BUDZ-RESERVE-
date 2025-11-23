import { QueueingCourt } from '../../queueing-courts/entities/queueing-court.entity';
export declare enum QueueMatchStatus {
    PENDING = "pending",
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum QueueMatchWinner {
    TEAM_A = "teamA",
    TEAM_B = "teamB",
    DRAW = "draw"
}
export declare enum QueueMatchGameType {
    MENS_DOUBLES = "mens-doubles",
    WOMENS_DOUBLES = "womens-doubles",
    MIXED_DOUBLES = "mixed-doubles"
}
export interface QueueMatchTeamPlayer {
    id: number;
    name: string;
    sex: 'male' | 'female';
    skill: 'Beginner' | 'Intermediate' | 'Advanced';
}
export declare class QueueMatch {
    id: number;
    userId: number;
    gameType: QueueMatchGameType;
    status: QueueMatchStatus;
    teamA: QueueMatchTeamPlayer[];
    teamB: QueueMatchTeamPlayer[];
    courtId: number | null;
    court: QueueingCourt | null;
    courtName: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    winner: QueueMatchWinner | null;
    createdAt: Date;
    updatedAt: Date;
}
