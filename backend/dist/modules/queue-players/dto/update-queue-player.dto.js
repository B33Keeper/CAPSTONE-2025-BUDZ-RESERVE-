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
exports.UpdateQueuePlayerDto = void 0;
const class_validator_1 = require("class-validator");
const queuePlayerStatuses = ['In Queue', 'Waiting'];
const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
const sexes = ['male', 'female'];
class UpdateQueuePlayerDto {
}
exports.UpdateQueuePlayerDto = UpdateQueuePlayerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], UpdateQueuePlayerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsIn)(skillLevels),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateQueuePlayerDto.prototype, "skill", void 0);
__decorate([
    (0, class_validator_1.IsIn)(sexes),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateQueuePlayerDto.prototype, "sex", void 0);
__decorate([
    (0, class_validator_1.IsIn)(queuePlayerStatuses),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateQueuePlayerDto.prototype, "status", void 0);
//# sourceMappingURL=update-queue-player.dto.js.map