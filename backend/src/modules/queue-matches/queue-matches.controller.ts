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
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { QueueMatchesService } from './queue-matches.service';
import { GenerateQueueMatchesDto } from './dto/generate-queue-matches.dto';
import { QueueMatchStatus } from './entities/queue-match.entity';
import { CompleteQueueMatchDto } from './dto/complete-queue-match.dto';
import { CreateQueueMatchDto } from './dto/create-queue-match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('queue-matches')
@Controller('queue-matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QueueMatchesController {
  constructor(private readonly queueMatchesService: QueueMatchesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate fair matches from the player queue' })
  generate(@Body() dto: GenerateQueueMatchesDto, @Request() req: any) {
    return this.queueMatchesService.generateMatches(dto, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a match manually' })
  create(@Body() dto: CreateQueueMatchDto, @Request() req: any) {
    return this.queueMatchesService.createMatch(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List queue matches, optionally filtered by status' })
  findAll(
    @Query('status', new ParseEnumPipe(QueueMatchStatus, { optional: true }))
    status?: QueueMatchStatus,
    @Request() req?: any,
  ) {
    return this.queueMatchesService.findAll(status, req?.user?.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get match history' })
  findHistory(@Request() req: any) {
    return this.queueMatchesService.findHistory(req.user.id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an active match as completed' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CompleteQueueMatchDto,
    @Request() req: any,
  ) {
    return this.queueMatchesService.completeMatch(id, body, req.user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending or active match' })
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.queueMatchesService.cancelMatch(id, req.user.id);
  }

  @Delete('pending')
  @ApiOperation({ summary: 'Clear all pending matches' })
  clearPending(@Request() req: any) {
    return this.queueMatchesService.clearPendingMatches(req.user.id);
  }
}

