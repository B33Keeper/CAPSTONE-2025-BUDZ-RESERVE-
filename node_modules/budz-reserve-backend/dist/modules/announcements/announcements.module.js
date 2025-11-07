"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const announcements_service_1 = require("./announcements.service");
const announcements_controller_1 = require("./announcements.controller");
const announcement_entity_1 = require("./entities/announcement.entity");
const user_entity_1 = require("../users/entities/user.entity");
const upload_module_1 = require("../upload/upload.module");
let AnnouncementsModule = class AnnouncementsModule {
};
exports.AnnouncementsModule = AnnouncementsModule;
exports.AnnouncementsModule = AnnouncementsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([announcement_entity_1.Announcement, user_entity_1.User]),
            platform_express_1.MulterModule.register({
                limits: {
                    fileSize: 10 * 1024 * 1024,
                },
            }),
            upload_module_1.UploadModule,
        ],
        controllers: [announcements_controller_1.AnnouncementsController],
        providers: [announcements_service_1.AnnouncementsService],
        exports: [announcements_service_1.AnnouncementsService],
    })
], AnnouncementsModule);
//# sourceMappingURL=announcements.module.js.map