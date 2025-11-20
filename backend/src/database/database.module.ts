import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
        // Use autoLoadEntities instead of explicit entities array for better performance
        // entities array is loaded automatically when autoLoadEntities is true
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
