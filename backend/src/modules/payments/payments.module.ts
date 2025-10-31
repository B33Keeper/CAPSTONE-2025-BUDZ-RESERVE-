import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PayMongoService } from './paymongo.service';
import { EmailReceiptService } from './email-receipt.service';
import { Payment } from './entities/payment.entity';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationsModule } from '../reservations/reservations.module';
import { CourtsModule } from '../courts/courts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Reservation, EquipmentRental, EquipmentRentalItem, Equipment]),
    ReservationsModule,
    CourtsModule,
    MailerModule,
  ],
  controllers: [PaymentsController, PaymentController, WebhookController],
  providers: [PaymentsService, PayMongoService, EmailReceiptService],
  exports: [PaymentsService, PayMongoService, EmailReceiptService],
})
export class PaymentsModule {}
