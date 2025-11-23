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
const queue_match_entity_1 = require("../queue-matches/entities/queue-match.entity");
let QueueingCourtsService = class QueueingCourtsService {
    constructor(queueingCourtsRepository, queueMatchesRepository) {
        this.queueingCourtsRepository = queueingCourtsRepository;
        this.queueMatchesRepository = queueMatchesRepository;
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
        const court = await this.queueingCourtsRepository.findOne({ where: { id } });
        if (!court) {
            throw new common_1.NotFoundException(`Queueing court with id ${id} not found.`);
        }
        const hasActiveMatch = await this.queueMatchesRepository.exist({
            where: {
                courtId: id,
                status: queue_match_entity_1.QueueMatchStatus.ACTIVE,
            },
        });
        if (hasActiveMatch) {
            throw new common_1.BadRequestException('Court cannot be deleted while a match is currently active on it.');
        }
        await this.queueMatchesRepository
            .createQueryBuilder()
            .update()
            .set({ courtId: null, courtName: null })
            .where('court_id = :id', { id })
            .execute();
        await this.queueingCourtsRepository.delete(id);
    }
    async removeAll() {
        const hasActiveMatches = await this.queueMatchesRepository.count({
            where: { status: queue_match_entity_1.QueueMatchStatus.ACTIVE },
        });
        if (hasActiveMatches > 0) {
            throw new common_1.BadRequestException('Cannot clear courts while there are active matches in progress.');
        }
        await this.queueMatchesRepository
            .createQueryBuilder()
            .update()
            .set({ courtId: null, courtName: null })
            .where('court_id IS NOT NULL')
            .execute();
        await this.queueingCourtsRepository
            .createQueryBuilder()
            .delete()
            .execute();
    }
};
exports.QueueingCourtsService = QueueingCourtsService;
exports.QueueingCourtsService = QueueingCourtsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(queueing_court_entity_1.QueueingCourt)),
    __param(1, (0, typeorm_1.InjectRepository)(queue_match_entity_1.QueueMatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], QueueingCourtsService);
//# sourceMappingURL=queueing-courts.service.js.map