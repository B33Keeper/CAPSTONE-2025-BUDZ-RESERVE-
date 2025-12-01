import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PayMongoService } from './paymongo.service';
import { EmailReceiptService } from './email-receipt.service';
import { EquipmentRentalSchedulerService } from './equipment-rental-scheduler.service';
import { EquipmentService } from '../equipment/equipment.service';
import { Payment } from './entities/payment.entity';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { User } from '../users/entities/user.entity';
import { ReservationsModule } from '../reservations/reservations.module';
import { CourtsModule } from '../courts/courts.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Reservation, EquipmentRental, EquipmentRentalItem, Equipment, User]),
    forwardRef(() => ReservationsModule),
    CourtsModule,
    EquipmentModule,
    NotificationsModule,
    MailerModule,
    AuthModule, // Import AuthModule to access SendGridService
  ],
  controllers: [PaymentsController, PaymentController, WebhookController],
  providers: [PaymentsService, PayMongoService, EmailReceiptService, EquipmentRentalSchedulerService],
  exports: [PaymentsService, PayMongoService, EmailReceiptService, EquipmentRentalSchedulerService],
})
export class PaymentsModule {}
