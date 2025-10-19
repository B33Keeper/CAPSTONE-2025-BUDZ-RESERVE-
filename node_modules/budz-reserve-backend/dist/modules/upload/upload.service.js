"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let UploadService = class UploadService {
    constructor(configService) {
        this.configService = configService;
    }
    async uploadFile(file, subfolder = 'general') {
        const uploadDir = this.configService.get('UPLOAD_DEST', 'uploads');
        const fullUploadDir = path.isAbsolute(uploadDir)
            ? path.join(uploadDir, subfolder)
            : path.join(process.cwd(), uploadDir, subfolder);
        if (!fs.existsSync(fullUploadDir)) {
            fs.mkdirSync(fullUploadDir, { recursive: true });
        }
        const fileExtension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
        const filePath = path.join(fullUploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        return `/uploads/${subfolder}/${fileName}`;
    }
    async deleteFile(filePath) {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Deleted file: ${filePath}`);
        }
    }
    async deleteOldAvatar(userId, usersService) {
        try {
            const user = await usersService.findOne(userId);
            if (user && user.profile_picture) {
                if (!user.profile_picture.startsWith('http')) {
                    console.log(`🗑️ Deleting old avatar: ${user.profile_picture}`);
                    await this.deleteFile(user.profile_picture);
                }
            }
        }
        catch (error) {
            console.error('Error deleting old avatar:', error);
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map