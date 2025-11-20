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
exports.QueueingCourtsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const queueing_courts_service_1 = require("./queueing-courts.service");
const create_queueing_court_dto_1 = require("./dto/create-queueing-court.dto");
let QueueingCourtsController = class QueueingCourtsController {
    constructor(queueingCourtsService) {
        this.queueingCourtsService = queueingCourtsService;
    }
    create(createQueueingCourtDto) {
        return this.queueingCourtsService.create(createQueueingCourtDto);
    }
    findAll() {
        return this.queueingCourtsService.findAll();
    }
    remove(id) {
        return this.queueingCourtsService.remove(id);
    }
    removeAll() {
        return this.queueingCourtsService.removeAll();
    }
};
exports.QueueingCourtsController = QueueingCourtsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a queueing court' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_queueing_court_dto_1.CreateQueueingCourtDto]),
    __metadata("design:returntype", void 0)
], QueueingCourtsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all queueing courts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QueueingCourtsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a queueing court by id' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], QueueingCourtsController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete all queueing courts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QueueingCourtsController.prototype, "removeAll", null);
exports.QueueingCourtsController = QueueingCourtsController = __decorate([
    (0, swagger_1.ApiTags)('queueing-courts'),
    (0, common_1.Controller)('queueing-courts'),
    __metadata("design:paramtypes", [queueing_courts_service_1.QueueingCourtsService])
], QueueingCourtsController);
//# sourceMappingURL=queueing-courts.controller.js.map