import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../modules/users/entities/user.entity';
import { Court } from '../modules/courts/entities/court.entity';
import { Equipment } from '../modules/equipment/entities/equipment.entity';
import { Reservation } from '../modules/reservations/entities/reservation.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { EquipmentRental } from '../modules/payments/entities/equipment-rental.entity';
import { EquipmentRentalItem } from '../modules/payments/entities/equipment-rental-item.entity';
import { TimeSlot } from '../modules/time-slots/entities/time-slot.entity';
import { Gallery } from '../modules/gallery/entities/gallery.entity';
import { Suggestion } from '../modules/suggestions/entities/suggestion.entity';
import { Announcement } from '../modules/announcements/entities/announcement.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'budz_reserve'),
        entities: [User, Court, Equipment, Reservation, Payment, EquipmentRental, EquipmentRentalItem, TimeSlot, Gallery, Suggestion, Announcement],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
