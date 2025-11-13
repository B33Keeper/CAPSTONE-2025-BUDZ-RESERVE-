import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { QueuePlayer } from '../entities/queue-player.entity';

const queuePlayerStatuses: QueuePlayer['status'][] = ['In Queue', 'Waiting'];
const skillLevels: QueuePlayer['skill'][] = ['Beginner', 'Intermediate', 'Advanced'];
const sexes: QueuePlayer['sex'][] = ['male', 'female'];

export class UpdateQueuePlayerDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  name?: string;

  @IsIn(skillLevels)
  @IsOptional()
  skill?: QueuePlayer['skill'];

  @IsIn(sexes)
  @IsOptional()
  sex?: QueuePlayer['sex'];

  @IsIn(queuePlayerStatuses)
  @IsOptional()
  status?: QueuePlayer['status'];
}

