import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationDto } from './create-reservation.dto';
import { ReservationStatus } from '../entities/reservation.entity';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
  @IsOptional()
  @IsEnum(ReservationStatus)
  Status?: ReservationStatus;
}
