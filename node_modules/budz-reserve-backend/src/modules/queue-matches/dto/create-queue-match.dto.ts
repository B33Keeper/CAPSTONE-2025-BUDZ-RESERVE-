import { IsEnum, IsInt, IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import { QueueMatchGameType } from '../entities/queue-match.entity';

class TeamPlayerDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsEnum(['male', 'female'])
  sex: 'male' | 'female';

  @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
  skill: 'Beginner' | 'Intermediate' | 'Advanced';
}

export class CreateQueueMatchDto {
  @IsEnum(QueueMatchGameType)
  gameType: QueueMatchGameType;

  @IsInt()
  @IsOptional()
  courtId?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamPlayerDto)
  teamA: TeamPlayerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamPlayerDto)
  teamB: TeamPlayerDto[];
}

