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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./entities/payment.entity");
const reservations_service_1 = require("../reservations/reservations.service");
let PaymentsService = class PaymentsService {
    constructor(paymentsRepository, reservationsService) {
        this.paymentsRepository = paymentsRepository;
        this.reservationsService = reservationsService;
    }
    async create(createPaymentDto) {
        const reservation = await this.reservationsService.findOne(createPaymentDto.reservation_id);
        const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const payment = this.paymentsRepository.create({
            ...createPaymentDto,
            transaction_id: transactionId,
            reference_number: reservation.Reference_Number,
        });
        return this.paymentsRepository.save(payment);
    }
    async findAll() {
        return this.paymentsRepository.find({
            relations: ['reservation'],
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const payment = await this.paymentsRepository.findOne({
            where: { id },
            relations: ['reservation'],
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment with ID ${id} not found`);
        }
        return payment;
    }
    async findByReservation(reservationId) {
        return this.paymentsRepository.find({
            where: { reservation_id: reservationId },
            relations: ['reservation'],
        });
    }
    async updateStatus(id, status) {
        const payment = await this.findOne(id);
        await this.paymentsRepository.update(id, { status: status });
        return this.findOne(id);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        reservations_service_1.ReservationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map