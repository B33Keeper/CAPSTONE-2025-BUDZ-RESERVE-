import { Repository } from 'typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
export declare class SuggestionsService {
    private suggestionsRepository;
    constructor(suggestionsRepository: Repository<Suggestion>);
    create(createSuggestionDto: CreateSuggestionDto): Promise<Suggestion>;
    findAll(): Promise<Suggestion[]>;
    findOne(id: number): Promise<Suggestion>;
    remove(id: number): Promise<void>;
}
