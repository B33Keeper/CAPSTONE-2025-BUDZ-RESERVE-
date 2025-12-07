import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';

@Injectable()
export class SuggestionsService {
  // 1 hour in milliseconds
  private readonly COOLDOWN_MS = 60 * 60 * 1000;

  constructor(
    @InjectRepository(Suggestion)
    private suggestionsRepository: Repository<Suggestion>,
  ) {}

  async create(createSuggestionDto: CreateSuggestionDto): Promise<Suggestion> {
    // Check for cooldown: 1 hour since last submission
    const oneHourAgo = new Date(Date.now() - this.COOLDOWN_MS);
    
    let lastSubmission: Suggestion | null = null;
    
    // If user is authenticated, check by user_id
    if (createSuggestionDto.user_id) {
      lastSubmission = await this.suggestionsRepository.findOne({
        where: {
          user_id: createSuggestionDto.user_id,
          created_at: MoreThan(oneHourAgo),
        },
        order: { created_at: 'DESC' },
      });
    } else {
      // For anonymous users, check by name
      lastSubmission = await this.suggestionsRepository.findOne({
        where: {
          name: createSuggestionDto.name,
          created_at: MoreThan(oneHourAgo),
        },
        order: { created_at: 'DESC' },
      });
    }
    
    if (lastSubmission) {
      const timeSinceLastSubmission = Date.now() - lastSubmission.created_at.getTime();
      const remainingCooldownMs = this.COOLDOWN_MS - timeSinceLastSubmission;
      const remainingMinutes = Math.ceil(remainingCooldownMs / (60 * 1000));
      
      throw new BadRequestException(
        `Please wait ${remainingMinutes} minute(s) before submitting another message. There is a 1-hour cooldown between submissions.`
      );
    }
    
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

