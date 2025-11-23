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
exports.EquipmentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const equipment_service_1 = require("./equipment.service");
const create_equipment_dto_1 = require("./dto/create-equipment.dto");
const update_equipment_dto_1 = require("./dto/update-equipment.dto");
const upload_service_1 = require("../upload/upload.service");
let EquipmentController = class EquipmentController {
    constructor(equipmentService, uploadService) {
        this.equipmentService = equipmentService;
        this.uploadService = uploadService;
        this.allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    }
    validateImage(file) {
        if (!file) {
            return;
        }
        if (!this.allowedImageMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Only images are allowed.');
        }
    }
    async create(createEquipmentDto, file) {
        if (file) {
            this.validateImage(file);
            const imagePath = await this.uploadService.uploadFile(file, 'equipments');
            createEquipmentDto.image_path = imagePath;
        }
        return this.equipmentService.create(createEquipmentDto);
    }
    findAll() {
        return this.equipmentService.findAll();
    }
    getAvailableEquipment() {
        return this.equipmentService.getAvailableEquipment();
    }
    findOne(id) {
        return this.equipmentService.findOne(id);
    }
    async update(id, updateEquipmentDto, file) {
        const existingEquipment = await this.equipmentService.findOne(id);
        if (file) {
            this.validateImage(file);
            const imagePath = await this.uploadService.uploadFile(file, 'equipments');
            updateEquipmentDto.image_path = imagePath;
            if (existingEquipment.image_path &&
                !existingEquipment.image_path.startsWith('http') &&
                !existingEquipment.image_path.startsWith('/assets/')) {
                await this.uploadService.deleteFile(existingEquipment.image_path);
            }
        }
        return this.equipmentService.update(id, updateEquipmentDto);
    }
    remove(id) {
        return this.equipmentService.remove(id);
    }
};
exports.EquipmentController = EquipmentController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new equipment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Equipment created successfully' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_equipment_dto_1.CreateEquipmentDto, Object]),
    __metadata("design:returntype", Promise)
], EquipmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all equipment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipment retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available equipment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available equipment retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "getAvailableEquipment", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get equipment by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipment retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Equipment not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update equipment by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipment updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Equipment not found' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_equipment_dto_1.UpdateEquipmentDto, Object]),
    __metadata("design:returntype", Promise)
], EquipmentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete equipment by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipment deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Equipment not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], EquipmentController.prototype, "remove", null);
exports.EquipmentController = EquipmentController = __decorate([
    (0, swagger_1.ApiTags)('equipment'),
    (0, common_1.Controller)('equipment'),
    __metadata("design:paramtypes", [equipment_service_1.EquipmentService,
        upload_service_1.UploadService])
], EquipmentController);
//# sourceMappingURL=equipment.controller.js.map