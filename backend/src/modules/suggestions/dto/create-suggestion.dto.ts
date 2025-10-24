import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator'

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  user_name: string

  @IsOptional()
  @IsNumber()
  user_id?: number

  @IsString()
  @IsNotEmpty()
  message: string
}
