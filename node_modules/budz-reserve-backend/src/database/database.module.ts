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
        // Disable synchronize when database is pre-initialized from SQL dump to avoid foreign key constraint errors
        synchronize: false, // Database schema is already created via docker-entrypoint-initdb.d scripts
        logging: configService.get('NODE_ENV') === 'development',
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: false, // Database is pre-initialized, migrations should be run manually if needed
        // Connection pool settings
        // Note: Only valid MySQL2 pool options are allowed here
        extra: {
          connectionLimit: 10,
          connectTimeout: 30000, // 30 seconds - valid MySQL2 option
          // acquireTimeout and timeout are not valid MySQL2 connection pool options
          // They cause warnings and may prevent proper connection
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
