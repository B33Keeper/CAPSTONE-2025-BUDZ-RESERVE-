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
exports.SuggestionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const suggestions_service_1 = require("./suggestions.service");
const create_suggestion_dto_1 = require("./dto/create-suggestion.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let SuggestionsController = class SuggestionsController {
    constructor(suggestionsService) {
        this.suggestionsService = suggestionsService;
    }
    async create(createSuggestionDto, req) {
        return this.suggestionsService.create(createSuggestionDto);
    }
    findAll() {
        return this.suggestionsService.findAll();
    }
    findOne(id) {
        return this.suggestionsService.findOne(id);
    }
    remove(id) {
        return this.suggestionsService.remove(id);
    }
};
exports.SuggestionsController = SuggestionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a suggestion' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Suggestion created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_suggestion_dto_1.CreateSuggestionDto, Object]),
    __metadata("design:returntype", Promise)
], SuggestionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all suggestions (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggestions retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuggestionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a suggestion by ID (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggestion retrieved successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SuggestionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a suggestion (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggestion deleted successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SuggestionsController.prototype, "remove", null);
exports.SuggestionsController = SuggestionsController = __decorate([
    (0, swagger_1.ApiTags)('suggestions'),
    (0, common_1.Controller)('suggestions'),
    __metadata("design:paramtypes", [suggestions_service_1.SuggestionsService])
], SuggestionsController);
//# sourceMappingURL=suggestions.controller.js.map