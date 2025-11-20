export declare class QueuePlayer {
    id: number;
    name: string;
    sex: 'male' | 'female';
    skill: 'Beginner' | 'Intermediate' | 'Advanced';
    gamesPlayed: number;
    status: 'In Queue' | 'Waiting';
    lastPlayed: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
