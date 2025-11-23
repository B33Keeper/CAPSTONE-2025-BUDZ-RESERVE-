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
exports.QueueMatchesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const queue_matches_service_1 = require("./queue-matches.service");
const generate_queue_matches_dto_1 = require("./dto/generate-queue-matches.dto");
const queue_match_entity_1 = require("./entities/queue-match.entity");
const complete_queue_match_dto_1 = require("./dto/complete-queue-match.dto");
const create_queue_match_dto_1 = require("./dto/create-queue-match.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let QueueMatchesController = class QueueMatchesController {
    constructor(queueMatchesService) {
        this.queueMatchesService = queueMatchesService;
    }
    generate(dto, req) {
        return this.queueMatchesService.generateMatches(dto, req.user.id);
    }
    create(dto, req) {
        return this.queueMatchesService.createMatch(dto, req.user.id);
    }
    findAll(status, req) {
        return this.queueMatchesService.findAll(status, req?.user?.id);
    }
    findHistory(req) {
        return this.queueMatchesService.findHistory(req.user.id);
    }
    complete(id, body, req) {
        return this.queueMatchesService.completeMatch(id, body, req.user.id);
    }
    cancel(id, req) {
        return this.queueMatchesService.cancelMatch(id, req.user.id);
    }
    clearPending(req) {
        return this.queueMatchesService.clearPendingMatches(req.user.id);
    }
};
exports.QueueMatchesController = QueueMatchesController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate fair matches from the player queue' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_queue_matches_dto_1.GenerateQueueMatchesDto, Object]),
    __metadata("design:returntype", void 0)
], QueueMatchesController.prototype, "generate", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a match manually' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_queue_match_dto_1.CreateQueueMatchDto, Object]),
    __metadata("design:returntype", void 0)
], QueueMatchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List queue matches, optionally filtered by status' }),
    __param(0, (0, common_1.Query)('status', new common_1.ParseEnumPipe(queue_match_entity_1.QueueMatchStatus, { optional: true }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QueueMatchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get match history' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QueueMatchesController.prototype, "findHistory", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an active match as completed' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, complete_queue_match_dto_1.CompleteQueueMatchDto, Object]),
    __metadata("design:returntype", void 0)
], QueueMatchesController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a pending or active match' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], QueueMatchesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)('pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all pending matches' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QueueMatchesController.prototype, "clearPending", null);
exports.QueueMatchesController = QueueMatchesController = __decorate([
    (0, swagger_1.ApiTags)('queue-matches'),
    (0, common_1.Controller)('queue-matches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [queue_matches_service_1.QueueMatchesService])
], QueueMatchesController);
//# sourceMappingURL=queue-matches.controller.js.map