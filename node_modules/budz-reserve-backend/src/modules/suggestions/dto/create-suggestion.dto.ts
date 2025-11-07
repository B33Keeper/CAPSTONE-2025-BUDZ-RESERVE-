import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsInt()
  user_id?: number;
}

