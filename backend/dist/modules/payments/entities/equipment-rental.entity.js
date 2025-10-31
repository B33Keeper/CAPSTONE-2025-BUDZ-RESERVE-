"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentRental = void 0;
const typeorm_1 = require("typeorm");
const equipment_rental_item_entity_1 = require("./equipment-rental-item.entity");
let EquipmentRental = class EquipmentRental {
};
exports.EquipmentRental = EquipmentRental;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EquipmentRental.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EquipmentRental.prototype, "reservation_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EquipmentRental.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EquipmentRental.prototype, "total_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EquipmentRental.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EquipmentRental.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EquipmentRental.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => equipment_rental_item_entity_1.EquipmentRentalItem, (item) => item.rental),
    __metadata("design:type", Array)
], EquipmentRental.prototype, "items", void 0);
exports.EquipmentRental = EquipmentRental = __decorate([
    (0, typeorm_1.Entity)('equipment_rentals')
], EquipmentRental);
//# sourceMappingURL=equipment-rental.entity.js.map