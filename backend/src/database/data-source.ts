import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

// Railway provides all database connection details via environment variables
// Supports both DB_CONNECTION and DB_TYPE for compatibility
const nodeEnv = configService.get('NODE_ENV');
const isProduction = nodeEnv === 'production';
// Check DB_CONNECTION first (Railway/Laravel style), then DB_TYPE
const dbConnection = configService.get('DB_CONNECTION') || configService.get('DB_TYPE') || 'mysql';
const dbType = (dbConnection === 'mysql' || dbConnection === 'postgres' ? dbConnection : 'mysql') as 'mysql' | 'postgres';

// Railway MySQL requires SSL in production
// Use the same configuration pattern as database.module.ts
// Defaults match Railway MySQL setup
const dbHost = String(configService.get('DB_HOST') || 'maglev.proxy.rlwy.net');
const dbPort = Number(configService.get('DB_PORT') || 21184);
const dbUsername = String(configService.get('DB_USERNAME') || 'root');
const dbPassword = String(configService.get('DB_PASSWORD') || '');
const dbDatabase = String(configService.get('DB_DATABASE') || 'railway');

const dataSourceOptions: DataSourceOptions = {
  type: dbType,
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbDatabase,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // Always use migrations for safety
  logging: nodeEnv === 'development' ? ['error', 'warn'] : false, // Reduce logging overhead in production
  // Railway MySQL requires SSL in production
  ssl: isProduction ? { rejectUnauthorized: false } : false,
} as DataSourceOptions;

export default new DataSource(dataSourceOptions);
