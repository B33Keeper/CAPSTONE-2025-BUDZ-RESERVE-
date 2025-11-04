"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const mailer_1 = require("@nestjs-modules/mailer");
const handlebars_adapter_1 = require("@nestjs-modules/mailer/dist/adapters/handlebars.adapter");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const courts_module_1 = require("./modules/courts/courts.module");
const equipment_module_1 = require("./modules/equipment/equipment.module");
const reservations_module_1 = require("./modules/reservations/reservations.module");
const payments_module_1 = require("./modules/payments/payments.module");
const upload_module_1 = require("./modules/upload/upload.module");
const time_slots_module_1 = require("./modules/time-slots/time-slots.module");
const gallery_module_1 = require("./modules/gallery/gallery.module");
const suggestions_module_1 = require("./modules/suggestions/suggestions.module");
const announcements_module_1 = require("./modules/announcements/announcements.module");
const health_controller_1 = require("./health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            mailer_1.MailerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    transport: {
                        host: configService.get('SMTP_HOST', 'smtp.gmail.com'),
                        port: configService.get('SMTP_PORT', 587),
                        secure: false,
                        auth: {
                            user: configService.get('SMTP_USER'),
                            pass: configService.get('SMTP_PASS'),
                        },
                    },
                    defaults: {
                        from: configService.get('SMTP_FROM', 'noreply@budzreserve.com'),
                    },
                    template: {
                        dir: process.cwd() + '/src/templates',
                        adapter: new handlebars_adapter_1.HandlebarsAdapter(),
                        options: {
                            strict: true,
                        },
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            courts_module_1.CourtsModule,
            equipment_module_1.EquipmentModule,
            reservations_module_1.ReservationsModule,
            payments_module_1.PaymentsModule,
            upload_module_1.UploadModule,
            time_slots_module_1.TimeSlotsModule,
            gallery_module_1.GalleryModule,
            suggestions_module_1.SuggestionsModule,
            announcements_module_1.AnnouncementsModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map