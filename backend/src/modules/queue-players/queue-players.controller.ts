import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { QueuePlayersService } from './queue-players.service';
import { QueuePlayersSchedulerService } from './queue-players-scheduler.service';
import { CreateQueuePlayerDto } from './dto/create-queue-player.dto';
import { QueuePlayer } from './entities/queue-player.entity';
import { UpdateQueuePlayerDto } from './dto/update-queue-player.dto';

@Controller('queue-players')
export class QueuePlayersController {
  constructor(
    private readonly queuePlayersService: QueuePlayersService,
    private readonly schedulerService: QueuePlayersSchedulerService,
  ) {}

  @Get()
  findAll(): Promise<QueuePlayer[]> {
    return this.queuePlayersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateQueuePlayerDto): Promise<QueuePlayer> {
    return this.queuePlayersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQueuePlayerDto,
  ): Promise<QueuePlayer> {
    return this.queuePlayersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.queuePlayersService.remove(id);
  }

  @Post('cleanup')
  async manualCleanup() {
    return this.schedulerService.manualCleanup();
  }

  @Delete('old')
  async deleteOldPlayers(@Query('days') days?: string) {
    const daysToKeep = days ? parseInt(days, 10) : 30;
    const deletedCount = await this.schedulerService.deleteOldPlayers(daysToKeep);
    return {
      message: `Deleted ${deletedCount} player(s) older than ${daysToKeep} days`,
      deletedCount,
    };
  }
}


