import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const SEX_OPTIONS = ['male', 'female'] as const;
const SKILL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const STATUS_OPTIONS = ['In Queue', 'Waiting'] as const;

export class CreateQueuePlayerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @IsNotEmpty()
  name: string;

  @IsIn(SEX_OPTIONS)
  sex: typeof SEX_OPTIONS[number];

  @IsIn(SKILL_OPTIONS)
  skill: typeof SKILL_OPTIONS[number];

  @IsOptional()
  @IsIn(STATUS_OPTIONS)
  status?: typeof STATUS_OPTIONS[number];

  @IsOptional()
  @IsDateString()
  lastPlayed?: string;
}

