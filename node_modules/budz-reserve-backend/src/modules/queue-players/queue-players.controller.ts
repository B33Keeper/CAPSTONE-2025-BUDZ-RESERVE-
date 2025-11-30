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
  Request,
  UseGuards,
} from '@nestjs/common';
import { QueuePlayersService } from './queue-players.service';
import { QueuePlayersSchedulerService } from './queue-players-scheduler.service';
import { CreateQueuePlayerDto } from './dto/create-queue-player.dto';
import { QueuePlayer } from './entities/queue-player.entity';
import { UpdateQueuePlayerDto } from './dto/update-queue-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('queue-players')
@UseGuards(JwtAuthGuard)
export class QueuePlayersController {
  constructor(
    private readonly queuePlayersService: QueuePlayersService,
    private readonly schedulerService: QueuePlayersSchedulerService,
  ) {}

  @Get()
  findAll(@Request() req: any): Promise<QueuePlayer[]> {
    return this.queuePlayersService.findAll(req.user.id);
  }

  @Get('history')
  findHistory(@Request() req: any) {
    return this.queuePlayersService.findHistory(req.user.id);
  }

  @Post('migrate')
  async migratePlayers(@Request() req: any) {
    const migratedCount = await this.queuePlayersService.migratePlayersToUser(req.user.id);
    return {
      message: `Successfully migrated ${migratedCount} player(s) to your account.`,
      migratedCount,
    };
  }

  @Post()
  create(@Body() dto: CreateQueuePlayerDto, @Request() req: any): Promise<QueuePlayer> {
    return this.queuePlayersService.create(dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQueuePlayerDto,
    @Request() req: any,
  ): Promise<QueuePlayer> {
    return this.queuePlayersService.update(id, dto, req.user.id);
  }

  @Post('cleanup')
  async manualCleanup() {
    return this.schedulerService.manualCleanup();
  }

  @Post('save-to-history')
  async savePlayersToHistory(@Request() req: any) {
    return this.schedulerService.savePlayersToHistory(req.user.id);
  }

  @Delete('history')
  async clearHistory(@Request() req: any) {
    return this.schedulerService.clearHistory(req.user.id);
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

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any): Promise<void> {
    return this.queuePlayersService.remove(id, req.user.id);
  }
}


