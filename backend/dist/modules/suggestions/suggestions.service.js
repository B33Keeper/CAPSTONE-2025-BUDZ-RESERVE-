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
        this.suggestions = [
            {
                id: 1,
                user_name: 'James Harden',
                user_id: 1,
                message: 'I just want share nothing but good vibes and positive energy to everyone in this community. Keep up the great work!',
                created_at: new Date('2025-09-03T09:45:00'),
                updated_at: new Date('2025-09-03T09:45:00')
            },
            {
                id: 2,
                user_name: 'Bronny James',
                user_id: 2,
                message: 'Napakasolid boss amo ng service nyo! Sobrang ganda ng facilities at very accommodating ang staff. More power!',
                created_at: new Date('2025-09-03T09:45:00'),
                updated_at: new Date('2025-09-03T09:45:00')
            },
            {
                id: 3,
                user_name: 'Stephen Curry',
                user_id: 3,
                message: 'Great facilities and excellent service! The courts are well-maintained and the staff is very professional.',
                created_at: new Date('2025-09-05T09:45:00'),
                updated_at: new Date('2025-09-05T09:45:00')
            },
            {
                id: 4,
                user_name: 'Hawkeye Mihawk',
                user_id: 4,
                message: 'Suggestion for better lighting in Court 3 during evening hours. Overall experience is fantastic!',
                created_at: new Date('2025-09-05T09:45:00'),
                updated_at: new Date('2025-09-05T09:45:00')
            },
            {
                id: 5,
                user_name: 'Monkey D. Luffy',
                user_id: 5,
                message: 'Amazing place to play badminton! The courts are perfect and the atmosphere is great. Highly recommended!',
                created_at: new Date('2025-09-05T09:45:00'),
                updated_at: new Date('2025-09-05T09:45:00')
            }
        ];
        this.nextId = 6;
    }
    async create(createSuggestionDto) {
        try {
            const suggestion = this.suggestionsRepository.create(createSuggestionDto);
            return await this.suggestionsRepository.save(suggestion);
        }
        catch (error) {
            console.log('Database not available, using in-memory storage');
            const newSuggestion = {
                id: this.nextId++,
                user_name: createSuggestionDto.user_name,
                user_id: createSuggestionDto.user_id || null,
                message: createSuggestionDto.message,
                created_at: new Date(),
                updated_at: new Date()
            };
            this.suggestions.push(newSuggestion);
            return newSuggestion;
        }
    }
    async findAll() {
        try {
            return await this.suggestionsRepository.find({
                order: { created_at: 'DESC' },
            });
        }
        catch (error) {
            console.log('Database not available, using in-memory storage');
            return this.suggestions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        }
    }
    async findOne(id) {
        try {
            return await this.suggestionsRepository.findOne({ where: { id } });
        }
        catch (error) {
            console.log('Database not available, using in-memory storage');
            return this.suggestions.find(s => s.id === id) || null;
        }
    }
    async remove(id) {
        try {
            await this.suggestionsRepository.delete(id);
        }
        catch (error) {
            console.log('Database not available, using in-memory storage');
            this.suggestions = this.suggestions.filter(s => s.id !== id);
        }
    }
};
exports.SuggestionsService = SuggestionsService;
exports.SuggestionsService = SuggestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(suggestion_entity_1.Suggestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SuggestionsService);
//# sourceMappingURL=suggestions.service.js.map