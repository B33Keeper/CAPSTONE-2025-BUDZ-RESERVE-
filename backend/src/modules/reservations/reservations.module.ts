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
import { Court } from '../courts/entities/court.entity';
import { PayMongoService } from '../payments/paymongo.service';
import { CourtsModule } from '../courts/courts.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { ReservationNotificationSchedulerService } from './reservation-notification-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Payment, EquipmentRental, EquipmentRentalItem, Equipment, User, Court]),
    CourtsModule,
    EquipmentModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, PayMongoService, ReservationNotificationSchedulerService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
