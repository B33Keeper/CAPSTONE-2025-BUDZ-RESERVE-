import { IsString, IsEnum, IsNumber, IsOptional, Length, Min } from 'class-validator';
import { CourtStatus } from '../entities/court.entity';

export class CreateCourtDto {
  @IsString()
  @Length(1, 100)
  Court_Name: string;

  @IsEnum(CourtStatus)
  @IsOptional()
  Status?: CourtStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  Price?: number;
}
