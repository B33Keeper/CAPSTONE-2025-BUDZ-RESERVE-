import { IsString, IsNotEmpty, IsOptional, IsInt, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Name must be at least 5 characters long' })
  @MaxLength(60, { message: 'Name must not exceed 60 characters' })
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Name can only contain letters and spaces (no numbers or special characters)',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsInt()
  user_id?: number;
}

