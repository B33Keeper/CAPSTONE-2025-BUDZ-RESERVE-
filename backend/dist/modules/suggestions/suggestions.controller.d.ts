import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
export declare class SuggestionsController {
    private readonly suggestionsService;
    constructor(suggestionsService: SuggestionsService);
    create(createSuggestionDto: CreateSuggestionDto): Promise<import("./entities/suggestion.entity").Suggestion>;
    findAll(): Promise<import("./entities/suggestion.entity").Suggestion[]>;
    findOne(id: string): Promise<import("./entities/suggestion.entity").Suggestion | null>;
    remove(id: string): Promise<void>;
}
