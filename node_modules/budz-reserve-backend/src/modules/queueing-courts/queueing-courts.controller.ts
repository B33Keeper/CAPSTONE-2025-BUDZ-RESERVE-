import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { QueueingCourtsService } from './queueing-courts.service';
import { CreateQueueingCourtDto } from './dto/create-queueing-court.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('queueing-courts')
@Controller('queueing-courts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QueueingCourtsController {
  constructor(
    private readonly queueingCourtsService: QueueingCourtsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a queueing court' })
  create(@Body() createQueueingCourtDto: CreateQueueingCourtDto) {
    return this.queueingCourtsService.create(createQueueingCourtDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all queueing courts' })
  findAll() {
    return this.queueingCourtsService.findAll();
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all queueing courts' })
  removeAll(@Request() req: any) {
    return this.queueingCourtsService.removeAll(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a queueing court by id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.queueingCourtsService.remove(id);
  }
}

