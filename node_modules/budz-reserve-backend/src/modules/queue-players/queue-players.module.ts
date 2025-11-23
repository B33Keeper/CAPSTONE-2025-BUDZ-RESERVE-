import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueuePlayersService } from './queue-players.service';
import { QueuePlayersController } from './queue-players.controller';
import { QueuePlayersSchedulerService } from './queue-players-scheduler.service';
import { QueuePlayer } from './entities/queue-player.entity';
import { QueuePlayerHistory } from './entities/queue-player-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QueuePlayer, QueuePlayerHistory])],
  controllers: [QueuePlayersController],
  providers: [QueuePlayersService, QueuePlayersSchedulerService],
  exports: [QueuePlayersSchedulerService],
})
export class QueuePlayersModule {}


