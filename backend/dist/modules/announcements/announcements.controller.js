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
exports.AnnouncementsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const announcements_service_1 = require("./announcements.service");
const create_announcement_dto_1 = require("./dto/create-announcement.dto");
const upload_service_1 = require("../upload/upload.service");
let AnnouncementsController = class AnnouncementsController {
    constructor(announcementsService, uploadService) {
        this.announcementsService = announcementsService;
        this.uploadService = uploadService;
    }
    async create(createAnnouncementDto, req) {
        if (req.user.role !== 'admin') {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        return await this.announcementsService.create(createAnnouncementDto, req.user.id);
    }
    async createWithImage(body, file, req) {
        if (req.user.role !== 'admin') {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new common_1.BadRequestException('Invalid file type. Only images are allowed.');
            }
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new common_1.BadRequestException('File too large. Maximum size is 10MB.');
            }
            const imagePath = await this.uploadService.uploadFile(file, 'announcements');
            body.image_url = imagePath;
            body.announcement_type = 'image';
        }
        const createAnnouncementDto = {
            title: body.title,
            content: body.content || null,
            image_url: body.image_url || null,
            announcement_type: body.announcement_type || 'text',
            is_active: body.is_active !== undefined ? body.is_active === 'true' : true,
        };
        return await this.announcementsService.create(createAnnouncementDto, req.user.id);
    }
    async findLatest() {
        return await this.announcementsService.findLatest();
    }
    async findAll(req) {
        if (req.user.role !== 'admin') {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        return await this.announcementsService.findAll();
    }
    async findOne(id) {
        return await this.announcementsService.findOne(+id);
    }
    async update(id, updateDto, req) {
        if (req.user.role !== 'admin') {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        return await this.announcementsService.update(+id, updateDto);
    }
    async remove(id, req) {
        if (req.user.role !== 'admin') {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        await this.announcementsService.remove(+id);
        return { message: 'Announcement deleted successfully' };
    }
};
exports.AnnouncementsController = AnnouncementsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new announcement (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Announcement created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_announcement_dto_1.CreateAnnouncementDto, Object]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('with-image'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new announcement with image upload (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Announcement created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "createWithImage", null);
__decorate([
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the latest active announcement' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Latest announcement retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "findLatest", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all announcements (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Announcements retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get announcement by ID (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Announcement retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update announcement (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Announcement updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete announcement (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Announcement deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "remove", null);
exports.AnnouncementsController = AnnouncementsController = __decorate([
    (0, swagger_1.ApiTags)('announcements'),
    (0, common_1.Controller)('announcements'),
    __metadata("design:paramtypes", [announcements_service_1.AnnouncementsService,
        upload_service_1.UploadService])
], AnnouncementsController);
//# sourceMappingURL=announcements.controller.js.map