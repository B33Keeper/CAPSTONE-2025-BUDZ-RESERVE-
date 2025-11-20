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
let QueuePlayersService = class QueuePlayersService {
    constructor(queuePlayersRepository) {
        this.queuePlayersRepository = queuePlayersRepository;
    }
    findAll() {
        return this.queuePlayersRepository.find({
            order: {
                name: 'ASC',
            },
        });
    }
    async create(createQueuePlayerDto) {
        const player = this.queuePlayersRepository.create({
            ...createQueuePlayerDto,
            status: createQueuePlayerDto.status ?? 'In Queue',
            gamesPlayed: 0,
            lastPlayed: createQueuePlayerDto.lastPlayed
                ? new Date(createQueuePlayerDto.lastPlayed)
                : new Date(),
        });
        return this.queuePlayersRepository.save(player);
    }
    async update(id, updateDto) {
        const player = await this.queuePlayersRepository.findOne({ where: { id } });
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
    async remove(id) {
        const result = await this.queuePlayersRepository.delete(id);
        if (!result.affected) {
            throw new common_1.NotFoundException(`Queue player with id ${id} not found`);
        }
    }
};
exports.QueuePlayersService = QueuePlayersService;
exports.QueuePlayersService = QueuePlayersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(queue_player_entity_1.QueuePlayer)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QueuePlayersService);
//# sourceMappingURL=queue-players.service.js.map