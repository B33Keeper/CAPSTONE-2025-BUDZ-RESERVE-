import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

// Railway provides all database connection details via environment variables
// Defaults are fallbacks only - Railway env vars will override these
const nodeEnv = configService.get('NODE_ENV');
const isProduction = nodeEnv === 'production';
const dbType = (configService.get<'postgres' | 'mysql'>('DB_TYPE', 'mysql') ?? 'mysql') as 'mysql' | 'postgres';

// Railway MySQL requires SSL in production
// Use the same configuration pattern as database.module.ts
const dataSourceOptions: DataSourceOptions = {
  type: dbType,
  host: configService.get('DB_HOST', 'localhost') as string,
  port: Number(configService.get('DB_PORT', 3306)),
  username: configService.get('DB_USERNAME', 'root') as string,
  password: configService.get('DB_PASSWORD', '') as string,
  database: configService.get('DB_DATABASE', 'budz_reserve') as string,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // Always use migrations for safety
  logging: nodeEnv === 'development' ? ['error', 'warn'] : false, // Reduce logging overhead in production
  // Railway MySQL requires SSL in production
  ssl: isProduction ? { rejectUnauthorized: false } : false,
} as DataSourceOptions;

export default new DataSource(dataSourceOptions);
