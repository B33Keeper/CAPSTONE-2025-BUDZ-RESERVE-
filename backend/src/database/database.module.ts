import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV');
        const isProduction = nodeEnv === 'production';

        return {
          type: (
            configService.get<'postgres' | 'mysql'>('DB_TYPE', 'postgres') ??
            'postgres'
          ) as 'postgres' | 'mysql',
          host: configService.get('DB_HOST', 'localhost'),
          port: Number(configService.get('DB_PORT', 5432)),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', ''),
          database: configService.get('DB_DATABASE', 'postgres'),
          synchronize: nodeEnv === 'development',
          logging: nodeEnv === 'development',
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
