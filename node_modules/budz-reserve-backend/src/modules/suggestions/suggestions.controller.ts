import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('suggestions')
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a suggestion' })
  @ApiResponse({ status: 201, description: 'Suggestion created successfully' })
  async create(@Body() createSuggestionDto: CreateSuggestionDto, @Request() req?: any) {
    // If user is authenticated, use their user_id (optional, doesn't require auth)
    // The suggestion can be submitted by anyone (logged in or not)
    // Note: We need to check if user is authenticated by checking the request
    // But since we're not using @UseGuards, we need to manually check the token
    return this.suggestionsService.create(createSuggestionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all suggestions (admin only)' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  findAll() {
    return this.suggestionsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a suggestion by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Suggestion retrieved successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suggestionsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a suggestion (admin only)' })
  @ApiResponse({ status: 200, description: 'Suggestion deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.suggestionsService.remove(id);
  }
}

