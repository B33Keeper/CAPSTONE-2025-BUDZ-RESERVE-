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
exports.QueuePlayersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const queue_player_entity_1 = require("./entities/queue-player.entity");
const queue_player_history_entity_1 = require("./entities/queue-player-history.entity");
let QueuePlayersService = class QueuePlayersService {
    constructor(queuePlayersRepository, queuePlayersHistoryRepository) {
        this.queuePlayersRepository = queuePlayersRepository;
        this.queuePlayersHistoryRepository = queuePlayersHistoryRepository;
    }
    findAll(userId) {
        return this.queuePlayersRepository.find({
            where: { userId },
            order: {
                name: 'ASC',
            },
        });
    }
    async create(createQueuePlayerDto, userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const player = this.queuePlayersRepository.create({
            ...createQueuePlayerDto,
            userId,
            status: createQueuePlayerDto.status ?? 'In Queue',
            gamesPlayed: 0,
            lastPlayed: createQueuePlayerDto.lastPlayed
                ? new Date(createQueuePlayerDto.lastPlayed)
                : today,
        });
        return this.queuePlayersRepository.save(player);
    }
    async update(id, updateDto, userId) {
        const player = await this.queuePlayersRepository.findOne({ where: { id, userId } });
        if (!player) {
            throw new common_1.NotFoundException(`Queue player with id ${id} not found`);
        }
        if (updateDto.name !== undefined) {
            player.name = updateDto.name;
        }
        if (updateDto.skill !== undefined) {
            player.skill = updateDto.skill;
        }
        if (updateDto.sex !== undefined) {
            player.sex = updateDto.sex;
        }
        if (updateDto.status !== undefined) {
            player.status = updateDto.status;
        }
        return this.queuePlayersRepository.save(player);
    }
    async remove(id, userId) {
        const result = await this.queuePlayersRepository.delete({ id, userId });
        if (!result.affected) {
            throw new common_1.NotFoundException(`Queue player with id ${id} not found`);
        }
    }
    async findHistory(userId) {
        return this.queuePlayersHistoryRepository.find({
            where: { userId },
            order: {
                archivedAt: 'DESC',
                name: 'ASC',
            },
        });
    }
    async migratePlayersToUser(userId) {
        const result = await this.queuePlayersRepository.update({ userId: 0 }, { userId });
        return result.affected || 0;
    }
};
exports.QueuePlayersService = QueuePlayersService;
exports.QueuePlayersService = QueuePlayersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(queue_player_entity_1.QueuePlayer)),
    __param(1, (0, typeorm_1.InjectRepository)(queue_player_history_entity_1.QueuePlayerHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], QueuePlayersService);
//# sourceMappingURL=queue-players.service.js.map