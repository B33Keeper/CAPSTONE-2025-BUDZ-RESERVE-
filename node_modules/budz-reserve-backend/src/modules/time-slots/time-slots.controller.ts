import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TimeSlotsService } from './time-slots.service';

@ApiTags('time-slots')
@Controller('time-slots')
export class TimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active time slots' })
  @ApiResponse({ status: 200, description: 'Time slots retrieved successfully' })
  findAll() {
    return this.timeSlotsService.findAll();
  }
}
