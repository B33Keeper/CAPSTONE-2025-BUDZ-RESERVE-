"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueMatchesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const queue_matches_controller_1 = require("./queue-matches.controller");
const queue_matches_service_1 = require("./queue-matches.service");
const queue_match_entity_1 = require("./entities/queue-match.entity");
const queue_match_history_entity_1 = require("./entities/queue-match-history.entity");
const queue_player_entity_1 = require("../queue-players/entities/queue-player.entity");
const queueing_court_entity_1 = require("../queueing-courts/entities/queueing-court.entity");
let QueueMatchesModule = class QueueMatchesModule {
};
exports.QueueMatchesModule = QueueMatchesModule;
exports.QueueMatchesModule = QueueMatchesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([queue_match_entity_1.QueueMatch, queue_match_history_entity_1.QueueMatchHistory, queue_player_entity_1.QueuePlayer, queueing_court_entity_1.QueueingCourt])],
        controllers: [queue_matches_controller_1.QueueMatchesController],
        providers: [queue_matches_service_1.QueueMatchesService],
        exports: [queue_matches_service_1.QueueMatchesService],
    })
], QueueMatchesModule);
//# sourceMappingURL=queue-matches.module.js.map