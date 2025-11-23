export declare class QueuePlayer {
    id: number;
    userId: number;
    name: string;
    sex: 'male' | 'female';
    skill: 'Beginner' | 'Intermediate' | 'Advanced';
    gamesPlayed: number;
    status: 'In Queue' | 'Waiting' | 'In Match';
    lastPlayed: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
