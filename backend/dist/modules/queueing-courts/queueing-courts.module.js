"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueingCourtsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const queueing_courts_controller_1 = require("./queueing-courts.controller");
const queueing_courts_service_1 = require("./queueing-courts.service");
const queueing_court_entity_1 = require("./entities/queueing-court.entity");
const queue_match_entity_1 = require("../queue-matches/entities/queue-match.entity");
let QueueingCourtsModule = class QueueingCourtsModule {
};
exports.QueueingCourtsModule = QueueingCourtsModule;
exports.QueueingCourtsModule = QueueingCourtsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([queueing_court_entity_1.QueueingCourt, queue_match_entity_1.QueueMatch])],
        controllers: [queueing_courts_controller_1.QueueingCourtsController],
        providers: [queueing_courts_service_1.QueueingCourtsService],
        exports: [queueing_courts_service_1.QueueingCourtsService],
    })
], QueueingCourtsModule);
//# sourceMappingURL=queueing-courts.module.js.map