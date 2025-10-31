import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
export declare class SuggestionsController {
    private readonly suggestionsService;
    constructor(suggestionsService: SuggestionsService);
    create(createSuggestionDto: CreateSuggestionDto, req?: any): Promise<import("./entities/suggestion.entity").Suggestion>;
    findAll(): Promise<import("./entities/suggestion.entity").Suggestion[]>;
    findOne(id: number): Promise<import("./entities/suggestion.entity").Suggestion>;
    remove(id: number): Promise<void>;
}
