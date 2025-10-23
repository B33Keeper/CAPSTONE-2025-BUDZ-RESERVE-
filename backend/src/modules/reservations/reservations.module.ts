import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from './entities/reservation.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PayMongoService } from '../payments/paymongo.service';
import { CourtsModule } from '../courts/courts.module';
import { EquipmentModule } from '../equipment/equipment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Payment]),
    CourtsModule,
    EquipmentModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, PayMongoService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
