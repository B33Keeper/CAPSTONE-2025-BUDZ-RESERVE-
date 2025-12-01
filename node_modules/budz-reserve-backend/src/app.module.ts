import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CourtsModule } from './modules/courts/courts.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadModule } from './modules/upload/upload.module';
import { TimeSlotsModule } from './modules/time-slots/time-slots.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { QueuePlayersModule } from './modules/queue-players/queue-players.module';
import { QueueingCourtsModule } from './modules/queueing-courts/queueing-courts.module';
import { QueueMatchesModule } from './modules/queue-matches/queue-matches.module';
import { FeeManagementModule } from './modules/fee-management/fee-management.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env', // Current directory
        '../.env', // Parent directory (root)
        './backend/.env', // Backend directory
      ],
    }),

    // Email configuration with timeout and connection settings
    // Only configure if SMTP credentials are provided
    // NOTE: Railway Free/Trial/Hobby plans have outbound SMTP disabled
    // This will cause a connection timeout warning, but the app will still start
    // Email functionality will not work on these plans - upgrade to Pro+ for SMTP
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const smtpHost = configService.get('SMTP_HOST', 'smtp.gmail.com');
        const smtpPort = Number(configService.get('SMTP_PORT', 587));
        const smtpUser = configService.get('SMTP_USER');
        const smtpPass = configService.get('SMTP_PASS');
        
        // Determine template directory path (needed for both real and dummy transport)
        const templateDir = join(process.cwd(), 'src', 'templates');
        
        // If SMTP credentials are not provided, use a dummy transport to prevent errors
        if (!smtpUser || !smtpPass) {
          console.warn('⚠️ SMTP credentials not configured. Email functionality will be disabled.');
          // Return a dummy transport that won't actually send emails
          return {
            transport: {
              jsonTransport: true, // Use JSON transport as a no-op
            },
            defaults: {
              from: configService.get('SMTP_FROM', 'noreply@budzreserve.com'),
            },
            template: {
              dir: templateDir,
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          };
        }
        
        // Build transport configuration with timeout settings
        const transportConfig: any = {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          // Connection timeout settings (in milliseconds)
          connectionTimeout: 10000, // 10 seconds - reduced to fail faster
          greetingTimeout: 10000, // 10 seconds
          socketTimeout: 20000, // 20 seconds for socket operations
          // Enable debug for troubleshooting
          debug: configService.get('NODE_ENV') === 'development',
          // Connection pool settings for better performance
          pool: false, // Disable pooling to avoid connection issues
          // Retry settings
          retry: {
            attempts: 2, // Reduced retries
            delay: 1000, // 1 second between retries
          },
          // Skip transporter verification on startup
          // This prevents blocking the app startup if SMTP is unreachable
          ignoreTLS: false,
        };
        
        // TLS options (only for non-secure connections)
        if (smtpPort !== 465) {
          transportConfig.tls = {
            rejectUnauthorized: false, // Allow self-signed certificates
            ciphers: 'SSLv3',
          };
        }
        
        return {
          transport: transportConfig,
          defaults: {
            from: configService.get('SMTP_FROM', 'noreply@budzreserve.com'),
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Scheduler
    ScheduleModule.forRoot(),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CourtsModule,
    EquipmentModule,
    ReservationsModule,
    PaymentsModule,
    UploadModule,
    TimeSlotsModule,
    GalleryModule,
    SuggestionsModule,
    AnnouncementsModule,
    QueuePlayersModule,
    QueueingCourtsModule,
    QueueMatchesModule,
    FeeManagementModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
