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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const reservations_service_1 = require("./reservations.service");
const create_reservation_dto_1 = require("./dto/create-reservation.dto");
const update_reservation_dto_1 = require("./dto/update-reservation.dto");
let ReservationsController = class ReservationsController {
    constructor(reservationsService) {
        this.reservationsService = reservationsService;
    }
    create(createReservationDto, req) {
        return this.reservationsService.create(createReservationDto, req.user.id);
    }
    createFromPayment(paymentData) {
        return this.reservationsService.createFromPayment(paymentData);
    }
    findAll() {
        return this.reservationsService.findAll();
    }
    findMyReservations(req) {
        return this.reservationsService.findByUser(req.user.id);
    }
    getAvailability(courtId, date) {
        return this.reservationsService.getAvailability(courtId, date);
    }
    findOne(id) {
        return this.reservationsService.findOne(id);
    }
    update(id, updateReservationDto) {
        return this.reservationsService.update(id, updateReservationDto);
    }
    remove(id) {
        return this.reservationsService.remove(id);
    }
};
exports.ReservationsController = ReservationsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new reservation' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Reservation created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid reservation data' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_reservation_dto_1.CreateReservationDto, Object]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('from-payment'),
    (0, swagger_1.ApiOperation)({ summary: 'Create reservations from payment data' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Reservations created successfully from payment' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid payment data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "createFromPayment", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all reservations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reservations retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-reservations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user reservations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User reservations retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "findMyReservations", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Get court availability' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Availability retrieved successfully' }),
    __param(0, (0, common_1.Query)('courtId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get reservation by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reservation retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reservation not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update reservation by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reservation updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reservation not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_reservation_dto_1.UpdateReservationDto]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel reservation by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reservation cancelled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reservation not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "remove", null);
exports.ReservationsController = ReservationsController = __decorate([
    (0, swagger_1.ApiTags)('reservations'),
    (0, common_1.Controller)('reservations'),
    __metadata("design:paramtypes", [reservations_service_1.ReservationsService])
], ReservationsController);
//# sourceMappingURL=reservations.controller.js.map