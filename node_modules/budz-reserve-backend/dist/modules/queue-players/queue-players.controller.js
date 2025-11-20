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
let QueuePlayersController = class QueuePlayersController {
    constructor(queuePlayersService, schedulerService) {
        this.queuePlayersService = queuePlayersService;
        this.schedulerService = schedulerService;
    }
    findAll() {
        return this.queuePlayersService.findAll();
    }
    create(dto) {
        return this.queuePlayersService.create(dto);
    }
    update(id, dto) {
        return this.queuePlayersService.update(id, dto);
    }
    remove(id) {
        return this.queuePlayersService.remove(id);
    }
    async manualCleanup() {
        return this.schedulerService.manualCleanup();
    }
    async deleteOldPlayers(days) {
        const daysToKeep = days ? parseInt(days, 10) : 30;
        const deletedCount = await this.schedulerService.deleteOldPlayers(daysToKeep);
        return {
            message: `Deleted ${deletedCount} player(s) older than ${daysToKeep} days`,
            deletedCount,
        };
    }
};
exports.QueuePlayersController = QueuePlayersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_queue_player_dto_1.CreateQueuePlayerDto]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_queue_player_dto_1.UpdateQueuePlayerDto]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "manualCleanup", null);
__decorate([
    (0, common_1.Delete)('old'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueuePlayersController.prototype, "deleteOldPlayers", null);
exports.QueuePlayersController = QueuePlayersController = __decorate([
    (0, common_1.Controller)('queue-players'),
    __metadata("design:paramtypes", [queue_players_service_1.QueuePlayersService,
        queue_players_scheduler_service_1.QueuePlayersSchedulerService])
], QueuePlayersController);
//# sourceMappingURL=queue-players.controller.js.map