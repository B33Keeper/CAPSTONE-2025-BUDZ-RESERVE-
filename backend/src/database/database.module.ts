import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): any => {
        const nodeEnv = configService.get('NODE_ENV');
        const isProduction = nodeEnv === 'production';
        const dbType = configService.get<'postgres' | 'mysql'>('DB_TYPE', 'mysql') ?? 'mysql';

        return {
          type: dbType,
          host: configService.get('DB_HOST', 'localhost'),
          port: Number(configService.get('DB_PORT', 3306)),
          username: configService.get('DB_USERNAME', 'root'),
          password: configService.get('DB_PASSWORD', ''),
          database: configService.get('DB_DATABASE', 'budz_reserve'),
          synchronize: false, // Always use migrations for safety
          logging: nodeEnv === 'development' ? ['error', 'warn'] : false, // Reduce logging overhead
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: true,
          retryAttempts: 5,
          retryDelay: 3000, // 3 seconds between retries
          autoLoadEntities: true,
          keepConnectionAlive: true,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
