import { Repository } from 'typeorm';
import { QueuePlayer } from './entities/queue-player.entity';
import { CreateQueuePlayerDto } from './dto/create-queue-player.dto';
import { UpdateQueuePlayerDto } from './dto/update-queue-player.dto';
export declare class QueuePlayersService {
    private readonly queuePlayersRepository;
    constructor(queuePlayersRepository: Repository<QueuePlayer>);
    findAll(): Promise<QueuePlayer[]>;
    create(createQueuePlayerDto: CreateQueuePlayerDto): Promise<QueuePlayer>;
    update(id: number, updateDto: UpdateQueuePlayerDto): Promise<QueuePlayer>;
    remove(id: number): Promise<void>;
}
