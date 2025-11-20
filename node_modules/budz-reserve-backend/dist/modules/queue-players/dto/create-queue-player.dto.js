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
exports.CreateQueuePlayerDto = void 0;
const class_validator_1 = require("class-validator");
const SEX_OPTIONS = ['male', 'female'];
const SKILL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const STATUS_OPTIONS = ['In Queue', 'Waiting'];
class CreateQueuePlayerDto {
}
exports.CreateQueuePlayerDto = CreateQueuePlayerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQueuePlayerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsIn)(SEX_OPTIONS),
    __metadata("design:type", Object)
], CreateQueuePlayerDto.prototype, "sex", void 0);
__decorate([
    (0, class_validator_1.IsIn)(SKILL_OPTIONS),
    __metadata("design:type", Object)
], CreateQueuePlayerDto.prototype, "skill", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(STATUS_OPTIONS),
    __metadata("design:type", Object)
], CreateQueuePlayerDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateQueuePlayerDto.prototype, "lastPlayed", void 0);
//# sourceMappingURL=create-queue-player.dto.js.map