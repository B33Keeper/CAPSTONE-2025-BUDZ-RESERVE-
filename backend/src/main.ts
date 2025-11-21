import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Starting Budz Reserve Backend...');
  console.log('📦 Environment:', process.env.NODE_ENV || 'development');
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(ConfigService);

    // Initialize upload directories on startup
    const uploadDir = configService.get('UPLOAD_DEST', 'uploads');
    const uploadPath = uploadDir.startsWith('/') 
      ? uploadDir 
      : join(process.cwd(), uploadDir);
    
    const requiredDirs = ['avatars', 'equipments', 'gallery', 'announcements'];
    
    console.log('📁 Initializing upload directories...');
    requiredDirs.forEach((subfolder) => {
      const dirPath = join(uploadPath, subfolder);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dirPath}`);
      }
    });
    console.log('✅ Upload directories initialized');

    // Serve static files
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });

    // Security middleware with comprehensive configuration
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // Compression middleware
    app.use(compression());

    // Custom security headers
    app.use((req: any, res: any, next: any) => {
      // Cache control headers
      if (req.url.startsWith('/api/')) {
        // API responses should not be cached
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (req.url.startsWith('/uploads/')) {
        // Static uploads can be cached for 1 year
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        // Static assets can be cached for 1 year
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // Default cache control
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }

      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      // Remove unnecessary headers
      res.removeHeader('X-XSS-Protection');
      
      next();
    });

    // CORS configuration
    app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    }));

    // Body size limits for file uploads
    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // API prefix
    const apiPrefix = configService.get('API_PREFIX', 'api');
    app.setGlobalPrefix(apiPrefix);

    const webhookPath = `/${apiPrefix}/webhook/paymongo`;

    app.use(
      express.json({
        limit: '50mb',
        verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
          if (req.originalUrl.startsWith(webhookPath)) {
            req.rawBody = Buffer.from(buf);
          }
        },
      }),
    );
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Budz Reserve API')
      .setDescription('Badminton Court Reservation System API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('courts', 'Court management endpoints')
      .addTag('equipment', 'Equipment management endpoints')
      .addTag('reservations', 'Reservation management endpoints')
      .addTag('payments', 'Payment processing endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

    const port = configService.get('PORT', 3001);
    const host = '0.0.0.0';
    
    console.log(`🌐 Attempting to start server on ${host}:${port}...`);
    await app.listen(port, host);

    // Use localhost for console output since 0.0.0.0 is not accessible in browsers
    console.log(`✅ Application is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
    
    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('⚠️  SIGTERM signal received: closing HTTP server');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('⚠️  SIGINT signal received: closing HTTP server');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});
