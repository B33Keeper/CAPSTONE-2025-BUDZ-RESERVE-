import { Repository } from 'typeorm';
import { QueuePlayer } from './entities/queue-player.entity';
import { QueuePlayerHistory } from './entities/queue-player-history.entity';
import { CreateQueuePlayerDto } from './dto/create-queue-player.dto';
import { UpdateQueuePlayerDto } from './dto/update-queue-player.dto';
export declare class QueuePlayersService {
    private readonly queuePlayersRepository;
    private readonly queuePlayersHistoryRepository;
    constructor(queuePlayersRepository: Repository<QueuePlayer>, queuePlayersHistoryRepository: Repository<QueuePlayerHistory>);
    findAll(userId: number): Promise<QueuePlayer[]>;
    create(createQueuePlayerDto: CreateQueuePlayerDto, userId: number): Promise<QueuePlayer>;
    update(id: number, updateDto: UpdateQueuePlayerDto, userId: number): Promise<QueuePlayer>;
    remove(id: number, userId: number): Promise<void>;
    findHistory(userId: number): Promise<QueuePlayerHistory[]>;
    migratePlayersToUser(userId: number): Promise<number>;
}
