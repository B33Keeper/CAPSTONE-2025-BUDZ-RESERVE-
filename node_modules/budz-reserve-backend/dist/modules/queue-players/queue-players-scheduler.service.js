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
var QueuePlayersSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuePlayersSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const queue_player_entity_1 = require("./entities/queue-player.entity");
let QueuePlayersSchedulerService = QueuePlayersSchedulerService_1 = class QueuePlayersSchedulerService {
    constructor(queuePlayersRepository) {
        this.queuePlayersRepository = queuePlayersRepository;
        this.logger = new common_1.Logger(QueuePlayersSchedulerService_1.name);
    }
    async handleDailyPlayerCleanup() {
        this.logger.log('Starting daily player cleanup task...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const oldPlayers = await this.queuePlayersRepository.find({
                where: {
                    lastPlayed: (0, typeorm_2.LessThan)(today),
                },
            });
            if (oldPlayers.length > 0) {
                this.logger.log(`Found ${oldPlayers.length} player(s) from previous days. These will be available in history.`);
                oldPlayers.forEach((player) => {
                    this.logger.debug(`Player "${player.name}" with lastPlayed: ${player.lastPlayed} is now in history`);
                });
            }
            else {
                this.logger.log('No old players found. All players are current.');
            }
            this.logger.log('Daily player cleanup task completed successfully.');
        }
        catch (error) {
            this.logger.error('Error during daily player cleanup:', error);
        }
    }
    async manualCleanup() {
        this.logger.log('Manual cleanup triggered...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oldPlayers = await this.queuePlayersRepository.find({
            where: {
                lastPlayed: (0, typeorm_2.LessThan)(today),
            },
        });
        return {
            message: `Found ${oldPlayers.length} player(s) from previous days`,
            oldPlayersCount: oldPlayers.length,
            oldPlayers,
        };
    }
    async deleteOldPlayers(daysToKeep = 30) {
        this.logger.log(`Deleting players older than ${daysToKeep} days...`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        cutoffDate.setHours(0, 0, 0, 0);
        const result = await this.queuePlayersRepository.delete({
            lastPlayed: (0, typeorm_2.LessThan)(cutoffDate),
        });
        const deletedCount = result.affected || 0;
        this.logger.log(`Deleted ${deletedCount} old player record(s)`);
        return deletedCount;
    }
};
exports.QueuePlayersSchedulerService = QueuePlayersSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueuePlayersSchedulerService.prototype, "handleDailyPlayerCleanup", null);
exports.QueuePlayersSchedulerService = QueuePlayersSchedulerService = QueuePlayersSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(queue_player_entity_1.QueuePlayer)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QueuePlayersSchedulerService);
//# sourceMappingURL=queue-players-scheduler.service.js.map