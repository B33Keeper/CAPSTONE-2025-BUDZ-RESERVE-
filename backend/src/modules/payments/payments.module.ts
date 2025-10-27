import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentController } from './payment.controller';
import { PayMongoService } from './paymongo.service';
import { Payment } from './entities/payment.entity';
import { ReservationsModule } from '../reservations/reservations.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ReservationsModule,
    UsersModule,
    MailerModule,
  ],
  controllers: [PaymentsController, PaymentController],
  providers: [PaymentsService, PayMongoService],
  exports: [PaymentsService, PayMongoService],
})
export class PaymentsModule {}
