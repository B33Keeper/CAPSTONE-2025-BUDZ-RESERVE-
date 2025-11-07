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
exports.CourtsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const court_entity_1 = require("./entities/court.entity");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
let CourtsService = class CourtsService {
    constructor(courtsRepository, reservationsRepository) {
        this.courtsRepository = courtsRepository;
        this.reservationsRepository = reservationsRepository;
    }
    async create(createCourtDto) {
        const court = this.courtsRepository.create(createCourtDto);
        return this.courtsRepository.save(court);
    }
    async findAll() {
        return this.courtsRepository.find({
            order: { Court_Id: 'ASC' },
        });
    }
    async findOne(id) {
        const court = await this.courtsRepository.findOne({
            where: { Court_Id: id },
        });
        if (!court) {
            throw new common_1.NotFoundException(`Court with ID ${id} not found`);
        }
        return court;
    }
    async update(id, updateCourtDto) {
        const court = await this.findOne(id);
        await this.courtsRepository.update(id, updateCourtDto);
        return this.findOne(id);
    }
    async remove(id) {
        const court = await this.findOne(id);
        const reservationCount = await this.reservationsRepository.count({
            where: { Court_ID: id },
        });
        if (reservationCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete court "${court.Court_Name}" because it has ${reservationCount} reservation(s) associated with it. Please delete or reassign the reservations first.`);
        }
        await this.courtsRepository.remove(court);
    }
    async getAvailableCourts() {
        return this.courtsRepository.find({
            where: { Status: court_entity_1.CourtStatus.AVAILABLE },
            order: { Court_Id: 'ASC' },
        });
    }
    async getCourtCount() {
        return this.courtsRepository.count();
    }
    async getAvailableCourtCount() {
        return this.courtsRepository.count({
            where: { Status: court_entity_1.CourtStatus.AVAILABLE },
        });
    }
};
exports.CourtsService = CourtsService;
exports.CourtsService = CourtsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(court_entity_1.Court)),
    __param(1, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CourtsService);
//# sourceMappingURL=courts.service.js.map