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
exports.GalleryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gallery_entity_1 = require("./entities/gallery.entity");
let GalleryService = class GalleryService {
    constructor(galleryRepository) {
        this.galleryRepository = galleryRepository;
    }
    async create(createGalleryDto) {
        const gallery = this.galleryRepository.create(createGalleryDto);
        return this.galleryRepository.save(gallery);
    }
    async findAll() {
        return this.galleryRepository.find({
            where: { status: 'active' },
            order: { sort_order: 'ASC', created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const gallery = await this.galleryRepository.findOne({
            where: { id },
        });
        if (!gallery) {
            throw new common_1.NotFoundException(`Gallery item with ID ${id} not found`);
        }
        return gallery;
    }
    async update(id, updateGalleryDto) {
        const gallery = await this.findOne(id);
        Object.assign(gallery, updateGalleryDto);
        return this.galleryRepository.save(gallery);
    }
    async remove(id) {
        const gallery = await this.findOne(id);
        await this.galleryRepository.remove(gallery);
    }
    async updateStatus(id, status) {
        const gallery = await this.findOne(id);
        gallery.status = status;
        return this.galleryRepository.save(gallery);
    }
    async reorder(ids) {
        for (let i = 0; i < ids.length; i++) {
            await this.galleryRepository.update(ids[i], { sort_order: i + 1 });
        }
    }
};
exports.GalleryService = GalleryService;
exports.GalleryService = GalleryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gallery_entity_1.Gallery)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GalleryService);
//# sourceMappingURL=gallery.service.js.map