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
exports.CreateQueueMatchDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const queue_match_entity_1 = require("../entities/queue-match.entity");
class TeamPlayerDto {
}
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], TeamPlayerDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeamPlayerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['male', 'female']),
    __metadata("design:type", String)
], TeamPlayerDto.prototype, "sex", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['Beginner', 'Intermediate', 'Advanced']),
    __metadata("design:type", String)
], TeamPlayerDto.prototype, "skill", void 0);
class CreateQueueMatchDto {
}
exports.CreateQueueMatchDto = CreateQueueMatchDto;
__decorate([
    (0, class_validator_1.IsEnum)(queue_match_entity_1.QueueMatchGameType),
    __metadata("design:type", String)
], CreateQueueMatchDto.prototype, "gameType", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateQueueMatchDto.prototype, "courtId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TeamPlayerDto),
    __metadata("design:type", Array)
], CreateQueueMatchDto.prototype, "teamA", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TeamPlayerDto),
    __metadata("design:type", Array)
], CreateQueueMatchDto.prototype, "teamB", void 0);
//# sourceMappingURL=create-queue-match.dto.js.map