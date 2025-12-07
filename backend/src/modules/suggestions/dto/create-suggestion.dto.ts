import { IsString, IsNotEmpty, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Name must be at least 12 characters long' })
  @MaxLength(40, { message: 'Name must not exceed 40 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsInt()
  user_id?: number;
}

