import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { QueueMatchesService } from './queue-matches.service';
import { GenerateQueueMatchesDto } from './dto/generate-queue-matches.dto';
import { QueueMatchStatus } from './entities/queue-match.entity';
import { CompleteQueueMatchDto } from './dto/complete-queue-match.dto';
import { CreateQueueMatchDto } from './dto/create-queue-match.dto';

@ApiTags('queue-matches')
@Controller('queue-matches')
export class QueueMatchesController {
  constructor(private readonly queueMatchesService: QueueMatchesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate fair matches from the player queue' })
  generate(@Body() dto: GenerateQueueMatchesDto) {
    return this.queueMatchesService.generateMatches(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a match manually' })
  create(@Body() dto: CreateQueueMatchDto) {
    return this.queueMatchesService.createMatch(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List queue matches, optionally filtered by status' })
  findAll(
    @Query('status', new ParseEnumPipe(QueueMatchStatus, { optional: true }))
    status?: QueueMatchStatus,
  ) {
    return this.queueMatchesService.findAll(status);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an active match as completed' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CompleteQueueMatchDto,
  ) {
    return this.queueMatchesService.completeMatch(id, body);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending or active match' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.queueMatchesService.cancelMatch(id);
  }

  @Delete('pending')
  @ApiOperation({ summary: 'Clear all pending matches' })
  clearPending() {
    return this.queueMatchesService.clearPendingMatches();
  }
}

