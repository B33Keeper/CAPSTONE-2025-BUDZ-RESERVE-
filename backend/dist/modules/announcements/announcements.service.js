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
exports.AnnouncementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const announcement_entity_1 = require("./entities/announcement.entity");
let AnnouncementsService = class AnnouncementsService {
    constructor(announcementsRepository) {
        this.announcementsRepository = announcementsRepository;
    }
    async create(createAnnouncementDto, userId) {
        await this.announcementsRepository.update({ is_active: true }, { is_active: false });
        const announcement = this.announcementsRepository.create({
            ...createAnnouncementDto,
            created_by: userId,
            is_active: true,
        });
        return await this.announcementsRepository.save(announcement);
    }
    async findLatest() {
        const announcement = await this.announcementsRepository.findOne({
            where: { is_active: true },
            relations: ['creator'],
            order: { created_at: 'DESC' },
        });
        return announcement;
    }
    async findAll() {
        return await this.announcementsRepository.find({
            relations: ['creator'],
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const announcement = await this.announcementsRepository.findOne({
            where: { id },
            relations: ['creator'],
        });
        if (!announcement) {
            throw new common_1.NotFoundException(`Announcement with ID ${id} not found`);
        }
        return announcement;
    }
    async remove(id) {
        const announcement = await this.findOne(id);
        await this.announcementsRepository.remove(announcement);
    }
    async update(id, updateDto) {
        const announcement = await this.findOne(id);
        if (updateDto.is_active === true) {
            await this.announcementsRepository
                .createQueryBuilder()
                .update(announcement_entity_1.Announcement)
                .set({ is_active: false })
                .where('is_active = :isActive', { isActive: true })
                .andWhere('id != :id', { id })
                .execute();
        }
        Object.assign(announcement, updateDto);
        return await this.announcementsRepository.save(announcement);
    }
};
exports.AnnouncementsService = AnnouncementsService;
exports.AnnouncementsService = AnnouncementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(announcement_entity_1.Announcement)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AnnouncementsService);
//# sourceMappingURL=announcements.service.js.map