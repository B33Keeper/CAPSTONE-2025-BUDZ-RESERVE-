import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Suggestion } from './entities/suggestion.entity'
import { CreateSuggestionDto } from './dto/create-suggestion.dto'

@Injectable()
export class SuggestionsService {
  private suggestions: Suggestion[] = [
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
  ]
  private nextId = 6

  constructor(
    @InjectRepository(Suggestion)
    private suggestionsRepository: Repository<Suggestion>,
  ) {}

  async create(createSuggestionDto: CreateSuggestionDto): Promise<Suggestion> {
    try {
      // Try database first
      const suggestion = this.suggestionsRepository.create(createSuggestionDto)
      return await this.suggestionsRepository.save(suggestion)
    } catch (error) {
      console.log('Database not available, using in-memory storage')
      // Fallback to in-memory storage
      const newSuggestion: Suggestion = {
        id: this.nextId++,
        user_name: createSuggestionDto.user_name,
        user_id: createSuggestionDto.user_id || null,
        message: createSuggestionDto.message,
        created_at: new Date(),
        updated_at: new Date()
      }
      this.suggestions.push(newSuggestion)
      return newSuggestion
    }
  }

  async findAll(): Promise<Suggestion[]> {
    try {
      // Try database first
      return await this.suggestionsRepository.find({
        order: { created_at: 'DESC' },
      })
    } catch (error) {
      console.log('Database not available, using in-memory storage')
      // Fallback to in-memory storage
      return this.suggestions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    }
  }

  async findOne(id: number): Promise<Suggestion | null> {
    try {
      // Try database first
      return await this.suggestionsRepository.findOne({ where: { id } })
    } catch (error) {
      console.log('Database not available, using in-memory storage')
      // Fallback to in-memory storage
      return this.suggestions.find(s => s.id === id) || null
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Try database first
      await this.suggestionsRepository.delete(id)
    } catch (error) {
      console.log('Database not available, using in-memory storage')
      // Fallback to in-memory storage
      this.suggestions = this.suggestions.filter(s => s.id !== id)
    }
  }
}
