"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = require("path");
const fs = __importStar(require("fs"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    console.log('🚀 Starting Budz Reserve Backend...');
    console.log('📦 Environment:', process.env.NODE_ENV || 'development');
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });
        const configService = app.get(config_1.ConfigService);
        const uploadDir = configService.get('UPLOAD_DEST', 'uploads');
        const uploadPath = uploadDir.startsWith('/')
            ? uploadDir
            : (0, path_1.join)(process.cwd(), uploadDir);
        const requiredDirs = ['avatars', 'equipments', 'gallery', 'announcements'];
        console.log('📁 Initializing upload directories...');
        requiredDirs.forEach((subfolder) => {
            const dirPath = (0, path_1.join)(uploadPath, subfolder);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`✅ Created directory: ${dirPath}`);
            }
        });
        console.log('✅ Upload directories initialized');
        app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), {
            prefix: '/uploads/',
        });
        app.use((0, helmet_1.default)({
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
        app.use((0, compression_1.default)());
        app.use((req, res, next) => {
            if (req.url.startsWith('/api/')) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
            else if (req.url.startsWith('/uploads/')) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
            else if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
            else {
                res.setHeader('Cache-Control', 'public, max-age=3600');
            }
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
            res.removeHeader('X-XSS-Protection');
            next();
        });
        app.use((0, cors_1.default)({
            origin: ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true,
        }));
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        const apiPrefix = configService.get('API_PREFIX', 'api');
        app.setGlobalPrefix(apiPrefix);
        const webhookPath = `/${apiPrefix}/webhook/paymongo`;
        app.use(express_1.default.json({
            limit: '50mb',
            verify: (req, _res, buf) => {
                if (req.originalUrl.startsWith(webhookPath)) {
                    req.rawBody = Buffer.from(buf);
                }
            },
        }));
        app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
        const config = new swagger_1.DocumentBuilder()
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
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
        const port = configService.get('PORT', 3001);
        const host = '0.0.0.0';
        console.log(`🌐 Attempting to start server on ${host}:${port}...`);
        await app.listen(port, host);
        console.log(`✅ Application is running on: http://localhost:${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
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
    }
    catch (error) {
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
//# sourceMappingURL=main.js.map