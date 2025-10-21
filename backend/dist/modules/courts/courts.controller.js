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
exports.CourtsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const courts_service_1 = require("./courts.service");
const create_court_dto_1 = require("./dto/create-court.dto");
const update_court_dto_1 = require("./dto/update-court.dto");
let CourtsController = class CourtsController {
    constructor(courtsService) {
        this.courtsService = courtsService;
    }
    create(createCourtDto) {
        return this.courtsService.create(createCourtDto);
    }
    findAll() {
        return this.courtsService.findAll();
    }
    getAvailableCourts() {
        return this.courtsService.getAvailableCourts();
    }
    getCourtCount() {
        return this.courtsService.getCourtCount();
    }
    getAvailableCourtCount() {
        return this.courtsService.getAvailableCourtCount();
    }
    findOne(id) {
        return this.courtsService.findOne(id);
    }
    update(id, updateCourtDto) {
        return this.courtsService.update(id, updateCourtDto);
    }
    remove(id) {
        return this.courtsService.remove(id);
    }
};
exports.CourtsController = CourtsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new court' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Court created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_court_dto_1.CreateCourtDto]),
    __metadata("design:returntype", void 0)
], CourtsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all courts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Courts retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CourtsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available courts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available courts retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CourtsController.prototype, "getAvailableCourts", null);
__decorate([
    (0, common_1.Get)('count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get total court count' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Court count retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CourtsController.prototype, "getCourtCount", null);
__decorate([
    (0, common_1.Get)('available-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available court count' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available court count retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CourtsController.prototype, "getAvailableCourtCount", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get court by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Court retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Court not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CourtsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update court by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Court updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Court not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_court_dto_1.UpdateCourtDto]),
    __metadata("design:returntype", void 0)
], CourtsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete court by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Court deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Court not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CourtsController.prototype, "remove", null);
exports.CourtsController = CourtsController = __decorate([
    (0, swagger_1.ApiTags)('courts'),
    (0, common_1.Controller)('courts'),
    __metadata("design:paramtypes", [courts_service_1.CourtsService])
], CourtsController);
//# sourceMappingURL=courts.controller.js.map