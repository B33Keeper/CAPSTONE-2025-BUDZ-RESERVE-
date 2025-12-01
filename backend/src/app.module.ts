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
        const skipSmtp = configService.get('SKIP_SMTP', 'false').toLowerCase() === 'true';
        // Check for Railway environment (Railway sets RAILWAY_ENVIRONMENT or RAILWAY_PROJECT_ID)
        const isRailway = !!(configService.get('RAILWAY_ENVIRONMENT') || 
                             configService.get('RAILWAY_PROJECT_ID') ||
                             configService.get('RAILWAY'));
        
        // Determine template directory path (needed for both real and dummy transport)
        const templateDir = join(process.cwd(), 'src', 'templates');
        
        // Helper function to create dummy transport
        // Create a custom transport that supports verify() but never connects
        const createDummyTransport = () => {
          console.warn('⚠️ Using dummy email transport. Emails will not be sent.');
          
          const nodemailer = require('nodemailer');
          
          // Create a minimal transport object that implements required methods
          // but never attempts any network connection
          const dummyTransport = {
            name: 'dummy',
            version: '1.0.0',
            // verify() method required by MailerModule - always succeeds
            verify: (callback?: (err: any, success: boolean) => void) => {
              console.log('✅ [DUMMY] Transport verification skipped (dummy mode)');
              if (callback) {
                callback(null, true);
              }
              return Promise.resolve(true);
            },
            // sendMail() method - just logs and returns success
            sendMail: async (mailOptions: any) => {
              console.log('📧 [DUMMY] Email would be sent:', {
                to: mailOptions.to,
                subject: mailOptions.subject,
              });
              return {
                messageId: 'dummy-' + Date.now() + '@dummy.local',
                response: '250 Dummy transport - email not sent',
                accepted: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
                rejected: [],
                pending: [],
              };
            },
            // close() method for cleanup
            close: () => {
              return Promise.resolve();
            },
          };
          
          return {
            transport: dummyTransport as any,
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
        };
        
        // If SKIP_SMTP is explicitly set, use dummy transport (for testing only)
        if (skipSmtp) {
          console.warn('⚠️  SMTP disabled via SKIP_SMTP flag. Using dummy email transport.');
          console.warn('   ⚠️  WARNING: This is for testing only. Emails will NOT be sent!');
          return createDummyTransport();
        }
        
        // If SMTP credentials are not provided, throw error in production
        if (!smtpUser || !smtpPass) {
          const nodeEnv = configService.get('NODE_ENV', 'production');
          if (nodeEnv === 'development') {
            console.warn('⚠️ SMTP credentials not configured. Using dummy transport for development.');
            return createDummyTransport();
          } else {
            console.error('❌ SMTP credentials not configured. Email functionality will not work.');
            console.error('   Please set SMTP_USER and SMTP_PASS environment variables.');
            // Still use dummy transport to prevent app crash, but log error
            return createDummyTransport();
          }
        }
        
        // Log Railway detection (but don't auto-disable SMTP - Pro+ plans support it)
        if (isRailway) {
          console.log('🚂 Railway environment detected.');
          console.log('   If SMTP connection fails, set SKIP_SMTP=true to use development mode.');
        }
        
        // Build transport configuration with aggressive timeout settings
        const transportConfig: any = {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          // Aggressive timeout settings to fail fast if blocked
          connectionTimeout: 5000, // 5 seconds - fail fast
          greetingTimeout: 5000, // 5 seconds
          socketTimeout: 10000, // 10 seconds for socket operations
          // Enable debug for troubleshooting
          debug: configService.get('NODE_ENV') === 'development',
          // Connection pool settings
          pool: false, // Disable pooling to avoid connection issues
          // Disable retries to fail fast
          retry: false,
          // Don't require TLS initially
          requireTLS: false,
          // Skip TLS verification if needed
          ignoreTLS: false,
        };
        
        // TLS options (only for non-secure connections)
        if (smtpPort !== 465) {
          transportConfig.tls = {
            rejectUnauthorized: false, // Allow self-signed certificates
            // Don't specify ciphers - let Node.js choose
          };
        }
        
        const mailerConfig = {
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
        
        console.log(`📧 Configuring SMTP: ${smtpHost}:${smtpPort} (user: ${smtpUser})`);
        console.log('ℹ️  If you see connection timeout errors, set SKIP_SMTP=true or upgrade Railway plan.');
        
        return mailerConfig;
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
