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
exports.SuggestionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const suggestion_entity_1 = require("./entities/suggestion.entity");
let SuggestionsService = class SuggestionsService {
    constructor(suggestionsRepository) {
        this.suggestionsRepository = suggestionsRepository;
    }
    async create(createSuggestionDto) {
        const suggestion = this.suggestionsRepository.create(createSuggestionDto);
        return this.suggestionsRepository.save(suggestion);
    }
    async findAll() {
        return this.suggestionsRepository.find({
            relations: ['user'],
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const suggestion = await this.suggestionsRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!suggestion) {
            throw new common_1.NotFoundException(`Suggestion with ID ${id} not found`);
        }
        return suggestion;
    }
    async remove(id) {
        await this.suggestionsRepository.delete(id);
    }
};
exports.SuggestionsService = SuggestionsService;
exports.SuggestionsService = SuggestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(suggestion_entity_1.Suggestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SuggestionsService);
//# sourceMappingURL=suggestions.service.js.map