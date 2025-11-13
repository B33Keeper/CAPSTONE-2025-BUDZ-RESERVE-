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
import { QueuePlayer } from '../modules/queue-players/entities/queue-player.entity';
import { QueueingCourt } from '../modules/queueing-courts/entities/queueing-court.entity';

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
        entities: [User, Court, Equipment, Reservation, Payment, EquipmentRental, EquipmentRentalItem, TimeSlot, Gallery, Suggestion, Announcement, QueuePlayer, QueueingCourt],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
        // Connection pool settings
        extra: {
          connectionLimit: 10,
          connectTimeout: 30000, // 30 seconds
          acquireTimeout: 30000, // 30 seconds
          timeout: 30000, // 30 seconds
        },
        // Retry connection settings
        retryAttempts: 5,
        retryDelay: 3000, // 3 seconds between retries
        autoLoadEntities: true,
        // Better error handling
        keepConnectionAlive: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
