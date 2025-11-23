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
exports.QueueingCourt = exports.QueueingCourtStatus = void 0;
const typeorm_1 = require("typeorm");
var QueueingCourtStatus;
(function (QueueingCourtStatus) {
    QueueingCourtStatus["AVAILABLE"] = "available";
    QueueingCourtStatus["OCCUPIED"] = "occupied";
    QueueingCourtStatus["MAINTENANCE"] = "maintenance";
    QueueingCourtStatus["UNAVAILABLE"] = "unavailable";
})(QueueingCourtStatus || (exports.QueueingCourtStatus = QueueingCourtStatus = {}));
let QueueingCourt = class QueueingCourt {
};
exports.QueueingCourt = QueueingCourt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QueueingCourt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], QueueingCourt.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QueueingCourtStatus,
        default: QueueingCourtStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], QueueingCourt.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QueueingCourt.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], QueueingCourt.prototype, "updatedAt", void 0);
exports.QueueingCourt = QueueingCourt = __decorate([
    (0, typeorm_1.Entity)('queueing_courts')
], QueueingCourt);
//# sourceMappingURL=queueing-court.entity.js.map