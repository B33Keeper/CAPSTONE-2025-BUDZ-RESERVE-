import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../modules/users/entities/user.entity';
import { Court } from '../modules/courts/entities/court.entity';
import { Equipment } from '../modules/equipment/entities/equipment.entity';
import { Reservation } from '../modules/reservations/entities/reservation.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { TimeSlot } from '../modules/time-slots/entities/time-slot.entity';
import { Suggestion } from '../modules/suggestions/entities/suggestion.entity';

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
        entities: [User, Court, Equipment, Reservation, Payment, TimeSlot, Suggestion],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
