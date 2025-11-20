import { IsEnum } from 'class-validator';

import { QueueMatchGameType } from '../entities/queue-match.entity';

export class GenerateQueueMatchesDto {
  @IsEnum(QueueMatchGameType)
  gameType: QueueMatchGameType;
}

