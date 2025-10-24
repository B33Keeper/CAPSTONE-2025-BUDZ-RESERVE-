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
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("./entities/reservation.entity");
const courts_service_1 = require("../courts/courts.service");
const equipment_service_1 = require("../equipment/equipment.service");
let ReservationsService = class ReservationsService {
    constructor(reservationsRepository, courtsService, equipmentService) {
        this.reservationsRepository = reservationsRepository;
        this.courtsService = courtsService;
        this.equipmentService = equipmentService;
    }
    async create(createReservationDto, userId) {
        const court = await this.courtsService.findOne(createReservationDto.Court_ID);
        if (court.Status !== 'Available') {
            throw new common_1.BadRequestException('Court is not available for reservation');
        }
        const existingReservation = await this.reservationsRepository.findOne({
            where: {
                Court_ID: createReservationDto.Court_ID,
                Reservation_Date: new Date(createReservationDto.Reservation_Date),
                Status: reservation_entity_1.ReservationStatus.CONFIRMED,
                Start_Time: (0, typeorm_2.Between)(createReservationDto.Start_Time, createReservationDto.End_Time),
            },
        });
        if (existingReservation) {
            throw new common_1.BadRequestException('Time slot is already reserved');
        }
        let totalAmount = court.Price;
        if (createReservationDto.equipment && createReservationDto.equipment.length > 0) {
            for (const item of createReservationDto.equipment) {
                const equipment = await this.equipmentService.findOne(item.equipment_id);
                totalAmount += equipment.price * item.quantity;
            }
        }
        const referenceNumber = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const reservation = this.reservationsRepository.create({
            ...createReservationDto,
            User_ID: userId,
            Total_Amount: totalAmount,
            Reference_Number: referenceNumber,
        });
        return this.reservationsRepository.save(reservation);
    }
    async findAll() {
        return this.reservationsRepository.find({
            relations: ['user', 'court'],
            order: { Created_at: 'DESC' },
        });
    }
    async findByUser(userId) {
        return this.reservationsRepository.find({
            where: { User_ID: userId },
            relations: ['court', 'payments'],
            order: { Created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const reservation = await this.reservationsRepository.findOne({
            where: { Reservation_ID: id },
            relations: ['user', 'court'],
        });
        if (!reservation) {
            throw new common_1.NotFoundException(`Reservation with ID ${id} not found`);
        }
        return reservation;
    }
    async update(id, updateReservationDto) {
        const reservation = await this.findOne(id);
        await this.reservationsRepository.update(id, updateReservationDto);
        return this.findOne(id);
    }
    async remove(id) {
        const reservation = await this.findOne(id);
        await this.reservationsRepository.remove(reservation);
    }
    async getAvailability(courtId, date) {
        const reservations = await this.reservationsRepository.find({
            where: {
                Court_ID: courtId,
                Reservation_Date: new Date(date),
                Status: reservation_entity_1.ReservationStatus.CONFIRMED,
            },
            select: ['Start_Time', 'End_Time'],
        });
        const timeSlots = [];
        for (let hour = 8; hour < 23; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
            const isReserved = reservations.some(res => res.Start_Time <= startTime && res.End_Time > startTime);
            timeSlots.push({
                start_time: startTime,
                end_time: endTime,
                available: !isReserved,
            });
        }
        return timeSlots;
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        courts_service_1.CourtsService,
        equipment_service_1.EquipmentService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map