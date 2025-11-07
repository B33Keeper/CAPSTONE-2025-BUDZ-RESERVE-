"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const mailer_1 = require("@nestjs-modules/mailer");
const payments_service_1 = require("./payments.service");
const payments_controller_1 = require("./payments.controller");
const payment_controller_1 = require("./payment.controller");
const webhook_controller_1 = require("./webhook.controller");
const paymongo_service_1 = require("./paymongo.service");
const email_receipt_service_1 = require("./email-receipt.service");
const payment_entity_1 = require("./entities/payment.entity");
const equipment_rental_entity_1 = require("./entities/equipment-rental.entity");
const equipment_rental_item_entity_1 = require("./entities/equipment-rental-item.entity");
const equipment_entity_1 = require("../equipment/entities/equipment.entity");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
const reservations_module_1 = require("../reservations/reservations.module");
const courts_module_1 = require("../courts/courts.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([payment_entity_1.Payment, reservation_entity_1.Reservation, equipment_rental_entity_1.EquipmentRental, equipment_rental_item_entity_1.EquipmentRentalItem, equipment_entity_1.Equipment]),
            reservations_module_1.ReservationsModule,
            courts_module_1.CourtsModule,
            mailer_1.MailerModule,
        ],
        controllers: [payments_controller_1.PaymentsController, payment_controller_1.PaymentController, webhook_controller_1.WebhookController],
        providers: [payments_service_1.PaymentsService, paymongo_service_1.PayMongoService, email_receipt_service_1.EmailReceiptService],
        exports: [payments_service_1.PaymentsService, paymongo_service_1.PayMongoService, email_receipt_service_1.EmailReceiptService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map