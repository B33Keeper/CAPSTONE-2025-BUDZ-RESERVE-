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
exports.QueuePlayersController = void 0;
const common_1 = require("@nestjs/common");
const queue_players_service_1 = require("./queue-players.service");
const queue_players_scheduler_service_1 = require("./queue-players-scheduler.service");
const create_queue_player_dto_1 = require("./dto/create-queue-player.dto");
const update_queue_player_dto_1 = require("./dto/update-queue-player.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let QueuePlayersController = class QueuePlayersController {
    constructor(queuePlayersService, schedulerService) {
        this.queuePlayersService = queuePlayersService;
        this.schedulerService = schedulerService;
    }
    findAll(req) {
        return this.queuePlayersService.findAll(req.user.id);
    }
    findHistory(req) {
        return this.queuePlayersService.findHistory(req.user.id);
    }
    async migratePlayers(req) {
        const migratedCount = await this.queuePlayersService.migratePlayersToUser(req.user.id);
        return {
            message: `Successfully migrated ${migratedCount} player(s) to your account.`,
            migratedCount,
        };
    }
    create(dto, req) {
        return this.queuePlayersService.create(dto, req.user.id);
    }
    update(id, dto, req) {
        return this.queuePlayersService.update(id, dto, req.user.id);
    }
    async manualCleanup() {
        return this.schedulerService.manualCleanup();
    }
    async savePlayersToHistory(req) {
        return this.schedulerService.savePlayersToHistory(req.user.id);
    }
    async clearHistory(req) {
        return this.schedulerService.clearHistory(req.user.id);
    }
    async deleteOldPlayers(days) {
        const daysToKeep = days ? parseInt(days, 10) : 30;
        const deletedCount = await this.schedulerService.deleteOldPlayers(daysToKeep);
        return {
            message: `Deleted ${deletedCount} player(s) older than ${daysToKeep} days`,
            deletedCount,
        };
    }
    remove(id, req) {
        return this.queuePlayersService.remove(id, req.user.id);
    }
};
exports.QueuePlayersController = QueuePlayersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QueuePlayersController.prototype, "findHistory", null);
__decorate([
    (0, common_1.Post)('migrate'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "migratePlayers", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_queue_player_dto_1.CreateQueuePlayerDto, Object]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_queue_player_dto_1.UpdateQueuePlayerDto, Object]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "manualCleanup", null);
__decorate([
    (0, common_1.Post)('save-to-history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "savePlayersToHistory", null);
__decorate([
    (0, common_1.Delete)('history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "clearHistory", null);
__decorate([
    (0, common_1.Delete)('old'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "deleteOldPlayers", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "remove", null);
exports.QueuePlayersController = QueuePlayersController = __decorate([
    (0, common_1.Controller)('queue-players'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [queue_players_service_1.QueuePlayersService,
        queue_players_scheduler_service_1.QueuePlayersSchedulerService])
], QueuePlayersController);
//# sourceMappingURL=queue-players.controller.js.map