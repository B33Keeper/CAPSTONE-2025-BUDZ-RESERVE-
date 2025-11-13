import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { QueueingCourtsService } from './queueing-courts.service';
import { CreateQueueingCourtDto } from './dto/create-queueing-court.dto';

@ApiTags('queueing-courts')
@Controller('queueing-courts')
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a queueing court by id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.queueingCourtsService.remove(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all queueing courts' })
  removeAll() {
    return this.queueingCourtsService.removeAll();
  }
}

