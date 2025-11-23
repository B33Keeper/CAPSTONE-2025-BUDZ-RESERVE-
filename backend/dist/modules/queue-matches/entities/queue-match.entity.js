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
exports.QueueMatch = exports.QueueMatchGameType = exports.QueueMatchWinner = exports.QueueMatchStatus = void 0;
const typeorm_1 = require("typeorm");
const queueing_court_entity_1 = require("../../queueing-courts/entities/queueing-court.entity");
var QueueMatchStatus;
(function (QueueMatchStatus) {
    QueueMatchStatus["PENDING"] = "pending";
    QueueMatchStatus["ACTIVE"] = "active";
    QueueMatchStatus["COMPLETED"] = "completed";
    QueueMatchStatus["CANCELLED"] = "cancelled";
})(QueueMatchStatus || (exports.QueueMatchStatus = QueueMatchStatus = {}));
var QueueMatchWinner;
(function (QueueMatchWinner) {
    QueueMatchWinner["TEAM_A"] = "teamA";
    QueueMatchWinner["TEAM_B"] = "teamB";
    QueueMatchWinner["DRAW"] = "draw";
})(QueueMatchWinner || (exports.QueueMatchWinner = QueueMatchWinner = {}));
var QueueMatchGameType;
(function (QueueMatchGameType) {
    QueueMatchGameType["MENS_DOUBLES"] = "mens-doubles";
    QueueMatchGameType["WOMENS_DOUBLES"] = "womens-doubles";
    QueueMatchGameType["MIXED_DOUBLES"] = "mixed-doubles";
})(QueueMatchGameType || (exports.QueueMatchGameType = QueueMatchGameType = {}));
let QueueMatch = class QueueMatch {
};
exports.QueueMatch = QueueMatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QueueMatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'int' }),
    __metadata("design:type", Number)
], QueueMatch.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: QueueMatchGameType }),
    __metadata("design:type", String)
], QueueMatch.prototype, "gameType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QueueMatchStatus,
        default: QueueMatchStatus.PENDING,
    }),
    __metadata("design:type", String)
], QueueMatch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], QueueMatch.prototype, "teamA", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], QueueMatch.prototype, "teamB", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'court_id', nullable: true }),
    __metadata("design:type", Object)
], QueueMatch.prototype, "courtId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => queueing_court_entity_1.QueueingCourt, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'court_id' }),
    __metadata("design:type", Object)
], QueueMatch.prototype, "court", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'court_name', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], QueueMatch.prototype, "courtName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], QueueMatch.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], QueueMatch.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QueueMatchWinner,
        nullable: true,
    }),
    __metadata("design:type", Object)
], QueueMatch.prototype, "winner", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QueueMatch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], QueueMatch.prototype, "updatedAt", void 0);
exports.QueueMatch = QueueMatch = __decorate([
    (0, typeorm_1.Entity)('queue_matches')
], QueueMatch);
//# sourceMappingURL=queue-match.entity.js.map