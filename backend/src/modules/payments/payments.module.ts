import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentController } from './payment.controller';
import { PayMongoService } from './paymongo.service';
import { Payment } from './entities/payment.entity';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ReservationsModule,
  ],
  controllers: [PaymentsController, PaymentController],
  providers: [PaymentsService, PayMongoService],
  exports: [PaymentsService, PayMongoService],
})
export class PaymentsModule {}
