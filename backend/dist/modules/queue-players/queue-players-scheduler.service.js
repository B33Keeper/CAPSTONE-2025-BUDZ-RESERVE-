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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const queue_player_entity_1 = require("./entities/queue-player.entity");
const queue_player_history_entity_1 = require("./entities/queue-player-history.entity");
let QueuePlayersSchedulerService = QueuePlayersSchedulerService_1 = class QueuePlayersSchedulerService {
    constructor(queuePlayersRepository, queuePlayersHistoryRepository) {
        this.queuePlayersRepository = queuePlayersRepository;
        this.queuePlayersHistoryRepository = queuePlayersHistoryRepository;
        this.logger = new common_1.Logger(QueuePlayersSchedulerService_1.name);
    }
    async handleDailyPlayerCleanup() {
        this.logger.log('Starting daily player cleanup task...');
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            today.setHours(0, 0, 0, 0);
            const oldPlayers = await this.queuePlayersRepository.find({
                where: {
                    lastPlayed: (0, typeorm_2.LessThan)(today),
                },
            });
            if (oldPlayers.length > 0) {
                this.logger.log(`Found ${oldPlayers.length} player(s) from previous days. Moving to history...`);
                const historyRecords = oldPlayers.map((player) => {
                    return this.queuePlayersHistoryRepository.create({
                        userId: player.userId,
                        originalId: player.id,
                        name: player.name,
                        sex: player.sex,
                        skill: player.skill,
                        gamesPlayed: player.gamesPlayed,
                        status: player.status,
                        lastPlayed: player.lastPlayed || new Date(),
                        createdAt: player.createdAt,
                        updatedAt: player.updatedAt,
                        archivedAt: new Date(),
                    });
                });
                await this.queuePlayersHistoryRepository.save(historyRecords);
                this.logger.log(`Successfully moved ${historyRecords.length} player(s) to history.`);
                const playerIds = oldPlayers.map((p) => p.id);
                await this.queuePlayersRepository.delete(playerIds);
                this.logger.log(`Removed ${playerIds.length} player(s) from current players table.`);
            }
            else {
                this.logger.log('No old players found. All players are current.');
            }
            const deletedCount = await this.deleteOldHistoryRecords(30);
            if (deletedCount > 0) {
                this.logger.log(`Removed ${deletedCount} old history record(s) older than 30 days.`);
            }
            this.logger.log('Daily player cleanup task completed successfully.');
        }
        catch (error) {
            this.logger.error('Error during daily player cleanup:', error);
        }
    }
    async manualCleanup() {
        this.logger.log('Manual cleanup triggered...');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        today.setHours(0, 0, 0, 0);
        const oldPlayers = await this.queuePlayersRepository.find({
            where: {
                lastPlayed: (0, typeorm_2.LessThan)(today),
            },
        });
        let movedToHistory = 0;
        if (oldPlayers.length > 0) {
            const historyRecords = oldPlayers.map((player) => {
                return this.queuePlayersHistoryRepository.create({
                    userId: player.userId,
                    originalId: player.id,
                    name: player.name,
                    sex: player.sex,
                    skill: player.skill,
                    gamesPlayed: player.gamesPlayed,
                    status: player.status,
                    lastPlayed: player.lastPlayed || new Date(),
                    createdAt: player.createdAt,
                    updatedAt: player.updatedAt,
                    archivedAt: new Date(),
                });
            });
            await this.queuePlayersHistoryRepository.save(historyRecords);
            movedToHistory = historyRecords.length;
            const playerIds = oldPlayers.map((p) => p.id);
            await this.queuePlayersRepository.delete(playerIds);
        }
        return {
            message: `Found ${oldPlayers.length} player(s) from previous days. ${movedToHistory} moved to history.`,
            oldPlayersCount: oldPlayers.length,
            movedToHistory,
            oldPlayers,
        };
    }
    async deleteOldHistoryRecords(daysToKeep = 30) {
        this.logger.log(`Deleting history records older than ${daysToKeep} days...`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        cutoffDate.setHours(0, 0, 0, 0);
        const result = await this.queuePlayersHistoryRepository.delete({
            archivedAt: (0, typeorm_2.LessThan)(cutoffDate),
        });
        const deletedCount = result.affected || 0;
        this.logger.log(`Deleted ${deletedCount} old history record(s)`);
        return deletedCount;
    }
    async deleteOldPlayers(daysToKeep = 30) {
        return this.deleteOldHistoryRecords(daysToKeep);
    }
    async savePlayersToHistory(userId) {
        this.logger.log(`Saving today's players to history for user ${userId}...`);
        const currentPlayers = await this.queuePlayersRepository.find({
            where: { userId },
            order: { name: 'ASC' },
        });
        if (currentPlayers.length === 0) {
            this.logger.log('No players found to save to history.');
            return {
                message: 'No players found to save to history.',
                savedCount: 0,
                players: [],
            };
        }
        const historyRecords = currentPlayers.map((player) => {
            return this.queuePlayersHistoryRepository.create({
                userId: player.userId,
                originalId: player.id,
                name: player.name,
                sex: player.sex,
                skill: player.skill,
                gamesPlayed: player.gamesPlayed,
                status: player.status,
                lastPlayed: player.lastPlayed || new Date(),
                createdAt: player.createdAt,
                updatedAt: player.updatedAt,
                archivedAt: new Date(),
            });
        });
        await this.queuePlayersHistoryRepository.save(historyRecords);
        this.logger.log(`Successfully saved ${historyRecords.length} player(s) to history.`);
        return {
            message: `Successfully saved ${historyRecords.length} player(s) to history.`,
            savedCount: historyRecords.length,
            players: currentPlayers,
        };
    }
    async clearHistory(userId) {
        this.logger.log(`Clearing all history records for user ${userId}...`);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        today.setHours(0, 0, 0, 0);
        const activeHistoryResult = await this.queuePlayersRepository.delete({
            userId,
            lastPlayed: (0, typeorm_2.LessThan)(today),
        });
        const activeHistoryDeletedCount = activeHistoryResult.affected || 0;
        this.logger.log(`Deleted ${activeHistoryDeletedCount} player(s) from active queue with old lastPlayed dates for user ${userId}.`);
        const historyTableResult = await this.queuePlayersHistoryRepository.delete({
            userId,
        });
        const historyTableDeletedCount = historyTableResult.affected || 0;
        this.logger.log(`Deleted ${historyTableDeletedCount} history record(s) from history table for user ${userId}.`);
        const totalDeleted = activeHistoryDeletedCount + historyTableDeletedCount;
        return {
            message: `Successfully cleared ${totalDeleted} history record(s) (${activeHistoryDeletedCount} from active queue, ${historyTableDeletedCount} from history table).`,
            deletedCount: totalDeleted,
            historyTableDeletedCount,
        };
    }
};
exports.QueuePlayersSchedulerService = QueuePlayersSchedulerService;
exports.QueuePlayersSchedulerService = QueuePlayersSchedulerService = QueuePlayersSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(queue_player_entity_1.QueuePlayer)),
    __param(1, (0, typeorm_1.InjectRepository)(queue_player_history_entity_1.QueuePlayerHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], QueuePlayersSchedulerService);
//# sourceMappingURL=queue-players-scheduler.service.js.map