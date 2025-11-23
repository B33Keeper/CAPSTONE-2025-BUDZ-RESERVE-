"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuePlayersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const queue_players_service_1 = require("./queue-players.service");
const queue_players_controller_1 = require("./queue-players.controller");
const queue_players_scheduler_service_1 = require("./queue-players-scheduler.service");
const queue_player_entity_1 = require("./entities/queue-player.entity");
const queue_player_history_entity_1 = require("./entities/queue-player-history.entity");
let QueuePlayersModule = class QueuePlayersModule {
};
exports.QueuePlayersModule = QueuePlayersModule;
exports.QueuePlayersModule = QueuePlayersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([queue_player_entity_1.QueuePlayer, queue_player_history_entity_1.QueuePlayerHistory])],
        controllers: [queue_players_controller_1.QueuePlayersController],
        providers: [queue_players_service_1.QueuePlayersService, queue_players_scheduler_service_1.QueuePlayersSchedulerService],
        exports: [queue_players_scheduler_service_1.QueuePlayersSchedulerService],
    })
], QueuePlayersModule);
//# sourceMappingURL=queue-players.module.js.map