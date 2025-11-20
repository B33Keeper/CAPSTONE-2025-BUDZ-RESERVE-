declare const SEX_OPTIONS: readonly ["male", "female"];
declare const SKILL_OPTIONS: readonly ["Beginner", "Intermediate", "Advanced"];
declare const STATUS_OPTIONS: readonly ["In Queue", "Waiting"];
export declare class CreateQueuePlayerDto {
    name: string;
    sex: typeof SEX_OPTIONS[number];
    skill: typeof SKILL_OPTIONS[number];
    status?: typeof STATUS_OPTIONS[number];
    lastPlayed?: string;
}
export {};
