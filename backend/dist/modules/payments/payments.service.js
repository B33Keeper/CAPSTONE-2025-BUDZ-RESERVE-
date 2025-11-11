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
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
const payment_entity_2 = require("./entities/payment.entity");
const equipment_rental_entity_1 = require("./entities/equipment-rental.entity");
const equipment_rental_item_entity_1 = require("./entities/equipment-rental-item.entity");
const equipment_entity_1 = require("../equipment/entities/equipment.entity");
let PaymentsService = class PaymentsService {
    constructor(paymentsRepository, reservationsRepository, equipmentRentalRepository, equipmentRentalItemRepository, equipmentRepository, reservationsService) {
        this.paymentsRepository = paymentsRepository;
        this.reservationsRepository = reservationsRepository;
        this.equipmentRentalRepository = equipmentRentalRepository;
        this.equipmentRentalItemRepository = equipmentRentalItemRepository;
        this.equipmentRepository = equipmentRepository;
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
    async getSalesReport(startDate, endDate) {
        console.log(`[SalesReport Service] Fetching payments between ${startDate.toISOString()} and ${endDate.toISOString()}`);
        let payments;
        try {
            console.log(`[SalesReport Service] Querying payments table...`);
            payments = await this.paymentsRepository.find({
                where: {
                    status: payment_entity_2.PaymentStatus.COMPLETED,
                },
                relations: ['reservation', 'reservation.user', 'reservation.court'],
                order: { created_at: 'DESC' },
            });
            console.log(`[SalesReport Service] Found ${payments.length} completed payments (all time)`);
            const beforeFilter = payments.length;
            payments = payments.filter(payment => {
                const paymentDate = new Date(payment.created_at);
                return paymentDate >= startDate && paymentDate <= endDate;
            });
            console.log(`[SalesReport Service] Filtered from ${beforeFilter} to ${payments.length} payments in date range`);
        }
        catch (error) {
            console.error(`[SalesReport Service] ERROR fetching payments:`, error);
            console.error(`[SalesReport Service] Error stack:`, error.stack);
            throw error;
        }
        const reportData = [];
        let totalReservations = 0;
        let totalIncome = 0;
        let totalCancellations = 0;
        for (const payment of payments) {
            const reservation = payment.reservation;
            if (!reservation)
                continue;
            totalReservations++;
            const amount = Number(payment.amount);
            totalIncome += amount;
            const formatTime = (time) => {
                const [hours, minutes] = time.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'pm' : 'am';
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                return `${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
            };
            const formatDate = (date) => {
                return new Date(date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            };
            const isCancelled = reservation.Status === 'Cancelled';
            if (isCancelled) {
                totalCancellations++;
            }
            let equipmentRentals = [];
            try {
                const rental = await this.equipmentRentalRepository.findOne({
                    where: { reservation_id: reservation.Reservation_ID },
                    relations: ['items'],
                });
                if (rental && rental.items && rental.items.length > 0) {
                    const items = await this.equipmentRentalItemRepository.find({
                        where: { rental_id: rental.id },
                    });
                    for (const item of items) {
                        const equipment = await this.equipmentRepository.findOne({
                            where: { id: item.equipment_id },
                        });
                        equipmentRentals.push({
                            equipmentName: equipment?.equipment_name || 'Equipment',
                            quantity: item.quantity,
                            hours: item.hours,
                        });
                    }
                }
            }
            catch (error) {
                console.error(`[SalesReport Service] Error fetching equipment rentals for reservation ${reservation.Reservation_ID}:`, error);
            }
            reportData.push({
                reservationId: reservation.Reservation_ID,
                customerName: reservation.user?.name || 'Unknown',
                courtName: reservation.court?.Court_Name || 'Unknown',
                time: `${formatTime(reservation.Start_Time)}-${formatTime(reservation.End_Time)}`,
                date: formatDate(payment.created_at || reservation.Reservation_Date),
                paymentMethod: payment.payment_method || 'Unknown',
                price: amount,
                status: isCancelled ? 'cancelled' : 'completed',
                equipmentRentals: equipmentRentals,
            });
        }
        return {
            data: reportData,
            summary: {
                totalReservations,
                totalIncome,
                totalCancellations,
            },
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(2, (0, typeorm_1.InjectRepository)(equipment_rental_entity_1.EquipmentRental)),
    __param(3, (0, typeorm_1.InjectRepository)(equipment_rental_item_entity_1.EquipmentRentalItem)),
    __param(4, (0, typeorm_1.InjectRepository)(equipment_entity_1.Equipment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        reservations_service_1.ReservationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map