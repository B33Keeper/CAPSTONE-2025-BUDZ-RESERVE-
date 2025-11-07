"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../modules/users/entities/user.entity");
const court_entity_1 = require("../modules/courts/entities/court.entity");
const equipment_entity_1 = require("../modules/equipment/entities/equipment.entity");
const reservation_entity_1 = require("../modules/reservations/entities/reservation.entity");
const payment_entity_1 = require("../modules/payments/entities/payment.entity");
const equipment_rental_entity_1 = require("../modules/payments/entities/equipment-rental.entity");
const equipment_rental_item_entity_1 = require("../modules/payments/entities/equipment-rental-item.entity");
const time_slot_entity_1 = require("../modules/time-slots/entities/time-slot.entity");
const gallery_entity_1 = require("../modules/gallery/entities/gallery.entity");
const suggestion_entity_1 = require("../modules/suggestions/entities/suggestion.entity");
const announcement_entity_1 = require("../modules/announcements/entities/announcement.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 3306),
                    username: configService.get('DB_USERNAME', 'root'),
                    password: configService.get('DB_PASSWORD', ''),
                    database: configService.get('DB_DATABASE', 'budz_reserve'),
                    entities: [user_entity_1.User, court_entity_1.Court, equipment_entity_1.Equipment, reservation_entity_1.Reservation, payment_entity_1.Payment, equipment_rental_entity_1.EquipmentRental, equipment_rental_item_entity_1.EquipmentRentalItem, time_slot_entity_1.TimeSlot, gallery_entity_1.Gallery, suggestion_entity_1.Suggestion, announcement_entity_1.Announcement],
                    synchronize: configService.get('NODE_ENV') === 'development',
                    logging: configService.get('NODE_ENV') === 'development',
                    migrations: ['dist/database/migrations/*.js'],
                    migrationsRun: true,
                }),
                inject: [config_1.ConfigService],
            }),
        ],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map