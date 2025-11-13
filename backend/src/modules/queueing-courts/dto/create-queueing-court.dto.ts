import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { QueueingCourtStatus } from '../entities/queueing-court.entity';

export class CreateQueueingCourtDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsEnum(QueueingCourtStatus)
  @IsOptional()
  status?: QueueingCourtStatus;
}

