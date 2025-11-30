import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): any => {
        // Railway provides all database connection details via environment variables
        // Supports both DB_CONNECTION and DB_TYPE for compatibility
        const nodeEnv = configService.get('NODE_ENV');
        const isProduction = nodeEnv === 'production';
        // Check DB_CONNECTION first (Railway/Laravel style), then DB_TYPE
        const dbConnection = configService.get('DB_CONNECTION') || configService.get('DB_TYPE') || 'mysql';
        const dbType = (dbConnection === 'mysql' || dbConnection === 'postgres' ? dbConnection : 'mysql') as 'mysql' | 'postgres';

        // Explicit type conversions for Railway compatibility
        // Defaults match Railway MySQL setup
        const dbHost = String(configService.get('DB_HOST') || 'maglev.proxy.rlwy.net');
        const dbPort = Number(configService.get('DB_PORT') || 21184);
        const dbUsername = String(configService.get('DB_USERNAME') || 'root');
        const dbPassword = String(configService.get('DB_PASSWORD') || '');
        const dbDatabase = String(configService.get('DB_DATABASE') || 'railway');

        return {
          type: dbType,
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          synchronize: false, // Always use migrations for safety
          logging: nodeEnv === 'development' ? ['error', 'warn'] : false, // Reduce logging overhead in production
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: true,
          retryAttempts: 5,
          retryDelay: 3000, // 3 seconds between retries
          autoLoadEntities: true,
          keepConnectionAlive: true,
          // Railway MySQL requires SSL in production
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
