import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(Suggestion)
    private suggestionsRepository: Repository<Suggestion>,
  ) {}

  async create(createSuggestionDto: CreateSuggestionDto): Promise<Suggestion> {
    const suggestion = this.suggestionsRepository.create(createSuggestionDto);
    return this.suggestionsRepository.save(suggestion);
  }

  async findAll(): Promise<Suggestion[]> {
    return this.suggestionsRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Suggestion> {
    const suggestion = await this.suggestionsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    if (!suggestion) {
      throw new NotFoundException(`Suggestion with ID ${id} not found`);
    }
    
    return suggestion;
  }

  async remove(id: number): Promise<void> {
    await this.suggestionsRepository.delete(id);
  }
}

