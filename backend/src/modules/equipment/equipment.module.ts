import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { Equipment } from './entities/equipment.entity';
import { EquipmentRentalItem } from '../payments/entities/equipment-rental-item.entity';
import { EquipmentRental } from '../payments/entities/equipment-rental.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, EquipmentRentalItem, EquipmentRental, Reservation]), UploadModule],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
