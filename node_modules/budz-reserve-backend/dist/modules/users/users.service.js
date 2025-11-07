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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(createUserDto) {
        const existingUser = await this.usersRepository.findOne({
            where: [
                { email: createUserDto.email },
                { username: createUserDto.username },
            ],
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email or username already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.usersRepository.save(user);
    }
    async findAll() {
        return this.usersRepository.find({
            select: ['id', 'name', 'username', 'email', 'age', 'sex', 'contact_number', 'profile_picture', 'is_active', 'created_at'],
        });
    }
    async getUserCount() {
        return this.usersRepository.count();
    }
    async getActiveUserCount() {
        return this.usersRepository.count({ where: { is_active: true } });
    }
    async findOne(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            select: ['id', 'name', 'username', 'email', 'age', 'sex', 'contact_number', 'profile_picture', 'is_active', 'role', 'created_at'],
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({
            where: { email },
        });
    }
    async findByUsername(username) {
        return this.usersRepository.findOne({
            where: { username },
        });
    }
    async update(id, updateUserDto) {
        const user = await this.findOne(id);
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.usersRepository.findOne({
                where: { email: updateUserDto.email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
            }
        }
        if (updateUserDto.username && updateUserDto.username !== user.username) {
            const existingUser = await this.usersRepository.findOne({
                where: { username: updateUserDto.username },
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this username already exists');
            }
        }
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
        }
        await this.usersRepository.update(id, updateUserDto);
        return this.findOne(id);
    }
    async remove(id) {
        const user = await this.findOne(id);
        if (user.profile_picture && !user.profile_picture.startsWith('http')) {
            try {
                const { UploadService } = await Promise.resolve().then(() => __importStar(require('../upload/upload.service')));
                const { ConfigService } = await Promise.resolve().then(() => __importStar(require('@nestjs/config')));
                const configService = new ConfigService();
                const uploadService = new UploadService(configService);
                await uploadService.deleteFile(user.profile_picture);
            }
            catch (error) {
                console.error('Error deleting user profile picture:', error);
            }
        }
        await this.usersRepository.remove(user);
    }
    async updateProfilePicture(id, profilePicture) {
        await this.usersRepository.update(id, { profile_picture: profilePicture });
        return this.findOne(id);
    }
    async verifyPassword(user, password) {
        return bcrypt.compare(password, user.password);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'username', 'email', 'password', 'name', 'age', 'sex', 'contact_number', 'profile_picture', 'is_active', 'created_at']
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await this.verifyPassword(user, currentPassword);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const isSamePassword = await this.verifyPassword(user, newPassword);
        if (isSamePassword) {
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await this.usersRepository.update(userId, { password: hashedNewPassword });
    }
    async updatePassword(userId, newPassword) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await this.usersRepository.update(userId, { password: hashedNewPassword });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map