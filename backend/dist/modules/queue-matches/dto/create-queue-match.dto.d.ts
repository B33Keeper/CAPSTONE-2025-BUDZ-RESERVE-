import { QueueMatchGameType } from '../entities/queue-match.entity';
declare class TeamPlayerDto {
    id: number;
    name: string;
    sex: 'male' | 'female';
    skill: 'Beginner' | 'Intermediate' | 'Advanced';
}
export declare class CreateQueueMatchDto {
    gameType: QueueMatchGameType;
    courtId?: number | null;
    teamA: TeamPlayerDto[];
    teamB: TeamPlayerDto[];
}
export {};
