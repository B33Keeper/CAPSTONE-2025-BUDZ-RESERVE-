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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueMatchHistory = void 0;
const typeorm_1 = require("typeorm");
const queue_match_entity_1 = require("./queue-match.entity");
let QueueMatchHistory = class QueueMatchHistory {
};
exports.QueueMatchHistory = QueueMatchHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QueueMatchHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'int' }),
    __metadata("design:type", Number)
], QueueMatchHistory.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'original_id', type: 'int' }),
    __metadata("design:type", Number)
], QueueMatchHistory.prototype, "originalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: queue_match_entity_1.QueueMatchGameType }),
    __metadata("design:type", String)
], QueueMatchHistory.prototype, "gameType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], QueueMatchHistory.prototype, "teamA", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], QueueMatchHistory.prototype, "teamB", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'court_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], QueueMatchHistory.prototype, "courtId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'court_name', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], QueueMatchHistory.prototype, "courtName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], QueueMatchHistory.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], QueueMatchHistory.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: queue_match_entity_1.QueueMatchWinner,
        nullable: true,
    }),
    __metadata("design:type", Object)
], QueueMatchHistory.prototype, "winner", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QueueMatchHistory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], QueueMatchHistory.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'archived_at', type: 'datetime' }),
    __metadata("design:type", Date)
], QueueMatchHistory.prototype, "archivedAt", void 0);
exports.QueueMatchHistory = QueueMatchHistory = __decorate([
    (0, typeorm_1.Entity)('queue_matches_history')
], QueueMatchHistory);
//# sourceMappingURL=queue-match-history.entity.js.map