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
exports.Court = exports.CourtStatus = void 0;
const typeorm_1 = require("typeorm");
const reservation_entity_1 = require("../../reservations/entities/reservation.entity");
var CourtStatus;
(function (CourtStatus) {
    CourtStatus["AVAILABLE"] = "Available";
    CourtStatus["MAINTENANCE"] = "Maintenance";
    CourtStatus["UNAVAILABLE"] = "Unavailable";
})(CourtStatus || (exports.CourtStatus = CourtStatus = {}));
let Court = class Court {
};
exports.Court = Court;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Court.prototype, "Court_Id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Court.prototype, "Court_Name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CourtStatus,
        default: CourtStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], Court.prototype, "Status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Court.prototype, "Price", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Court.prototype, "Created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Court.prototype, "Updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reservation_entity_1.Reservation, (reservation) => reservation.court),
    __metadata("design:type", Array)
], Court.prototype, "reservations", void 0);
exports.Court = Court = __decorate([
    (0, typeorm_1.Entity)('courts')
], Court);
//# sourceMappingURL=court.entity.js.map