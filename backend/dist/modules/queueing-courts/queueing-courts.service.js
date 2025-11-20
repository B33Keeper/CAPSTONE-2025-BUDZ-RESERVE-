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
exports.QueueingCourtsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const queueing_court_entity_1 = require("./entities/queueing-court.entity");
let QueueingCourtsService = class QueueingCourtsService {
    constructor(queueingCourtsRepository) {
        this.queueingCourtsRepository = queueingCourtsRepository;
    }
    async create(createQueueingCourtDto) {
        const existingCourt = await this.queueingCourtsRepository.findOne({
            where: { name: createQueueingCourtDto.name },
        });
        if (existingCourt) {
            throw new common_1.ConflictException('Court name already exists.');
        }
        const court = this.queueingCourtsRepository.create({
            ...createQueueingCourtDto,
            status: createQueueingCourtDto.status ?? queueing_court_entity_1.QueueingCourtStatus.AVAILABLE,
        });
        return this.queueingCourtsRepository.save(court);
    }
    async findAll() {
        return this.queueingCourtsRepository.find({
            order: { id: 'ASC' },
        });
    }
    async remove(id) {
        const result = await this.queueingCourtsRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Queueing court with id ${id} not found.`);
        }
    }
    async removeAll() {
        await this.queueingCourtsRepository.clear();
    }
};
exports.QueueingCourtsService = QueueingCourtsService;
exports.QueueingCourtsService = QueueingCourtsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(queueing_court_entity_1.QueueingCourt)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QueueingCourtsService);
//# sourceMappingURL=queueing-courts.service.js.map