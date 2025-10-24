import { IsDateString, IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '../entities/reservation.entity';

export class EquipmentItemDto {
  @IsNumber()
  equipment_id: number;

  @IsNumber()
  quantity: number;
}

export class CreateReservationDto {
  @IsNumber()
  Court_ID: number;

  @IsDateString()
  Reservation_Date: string;

  @IsString()
  Start_Time: string;

  @IsString()
  End_Time: string;

  @IsOptional()
  @IsString()
  Notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentItemDto)
  equipment?: EquipmentItemDto[];
}
