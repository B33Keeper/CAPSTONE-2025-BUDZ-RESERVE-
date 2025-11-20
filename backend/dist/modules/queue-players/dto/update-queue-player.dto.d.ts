import { QueuePlayer } from '../entities/queue-player.entity';
export declare class UpdateQueuePlayerDto {
    name?: string;
    skill?: QueuePlayer['skill'];
    sex?: QueuePlayer['sex'];
    status?: QueuePlayer['status'];
}
