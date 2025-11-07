import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from './entities/reservation.entity';
import { Payment } from '../payments/entities/payment.entity';
import { EquipmentRental } from '../payments/entities/equipment-rental.entity';
import { EquipmentRentalItem } from '../payments/entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { User } from '../users/entities/user.entity';
import { PayMongoService } from '../payments/paymongo.service';
import { CourtsModule } from '../courts/courts.module';
import { EquipmentModule } from '../equipment/equipment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Payment, EquipmentRental, EquipmentRentalItem, Equipment, User]),
    CourtsModule,
    EquipmentModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, PayMongoService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
