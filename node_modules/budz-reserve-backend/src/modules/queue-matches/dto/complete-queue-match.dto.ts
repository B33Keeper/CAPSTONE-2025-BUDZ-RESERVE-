import { IsEnum } from 'class-validator';

import { QueueMatchWinner } from '../entities/queue-match.entity';

export class CompleteQueueMatchDto {
  @IsEnum(QueueMatchWinner)
  winner: QueueMatchWinner;
}

