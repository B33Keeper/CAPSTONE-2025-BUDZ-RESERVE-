import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

const isProduction = configService.get('NODE_ENV') === 'production';

export default new DataSource({
  type: (configService.get<'postgres' | 'mysql'>('DB_TYPE', 'postgres') ??
    'postgres') as 'postgres' | 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: Number(configService.get('DB_PORT', 5432)),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', ''),
  database: configService.get('DB_DATABASE', 'postgres'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});
