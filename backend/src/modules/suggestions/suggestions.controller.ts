import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common'
import { SuggestionsService } from './suggestions.service'
import { CreateSuggestionDto } from './dto/create-suggestion.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  async create(@Body() createSuggestionDto: CreateSuggestionDto) {
    try {
      console.log('Creating suggestion:', createSuggestionDto)
      const result = await this.suggestionsService.create(createSuggestionDto)
      console.log('Suggestion created successfully:', result)
      return result
    } catch (error) {
      console.error('Error creating suggestion:', error)
      throw error
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.suggestionsService.findAll()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.suggestionsService.findOne(+id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.suggestionsService.remove(+id)
  }
}
