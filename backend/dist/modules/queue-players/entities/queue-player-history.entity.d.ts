export declare class QueuePlayerHistory {
    id: number;
    userId: number;
    originalId: number;
    name: string;
    sex: 'male' | 'female';
    skill: 'Beginner' | 'Intermediate' | 'Advanced';
    gamesPlayed: number;
    status: 'In Queue' | 'Waiting' | 'In Match';
    lastPlayed: Date | null;
    createdAt: Date;
    updatedAt: Date;
    archivedAt: Date;
}
