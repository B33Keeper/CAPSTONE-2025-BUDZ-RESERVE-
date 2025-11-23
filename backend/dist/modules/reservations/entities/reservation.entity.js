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
exports.Reservation = exports.ReservationStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const court_entity_1 = require("../../courts/entities/court.entity");
const payment_entity_1 = require("../../payments/entities/payment.entity");
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "Pending";
    ReservationStatus["CONFIRMED"] = "Confirmed";
    ReservationStatus["CANCELLED"] = "Cancelled";
    ReservationStatus["COMPLETED"] = "Completed";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
let Reservation = class Reservation {
};
exports.Reservation = Reservation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Reservation.prototype, "Reservation_ID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Reservation.prototype, "User_ID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Reservation.prototype, "Court_ID", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Reservation.prototype, "Reservation_Date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], Reservation.prototype, "Start_Time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], Reservation.prototype, "End_Time", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ReservationStatus,
        default: ReservationStatus.PENDING,
    }),
    __metadata("design:type", String)
], Reservation.prototype, "Status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Reservation.prototype, "Total_Amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Reservation.prototype, "Reference_Number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Reservation.prototype, "Paymongo_Reference_Number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Reservation.prototype, "Notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Reservation.prototype, "Is_Admin_Created", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Reservation.prototype, "Created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Reservation.prototype, "Updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.reservations),
    (0, typeorm_1.JoinColumn)({ name: 'User_ID' }),
    __metadata("design:type", user_entity_1.User)
], Reservation.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => court_entity_1.Court, (court) => court.reservations),
    (0, typeorm_1.JoinColumn)({ name: 'Court_ID' }),
    __metadata("design:type", court_entity_1.Court)
], Reservation.prototype, "court", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.Payment, (payment) => payment.reservation),
    __metadata("design:type", Array)
], Reservation.prototype, "payments", void 0);
exports.Reservation = Reservation = __decorate([
    (0, typeorm_1.Entity)('reservations')
], Reservation);
//# sourceMappingURL=reservation.entity.js.map