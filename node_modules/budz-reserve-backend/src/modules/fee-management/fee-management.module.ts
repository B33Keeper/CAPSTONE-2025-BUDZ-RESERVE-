import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeManagementService } from './fee-management.service';
import { FeeManagementController } from './fee-management.controller';
import { FeeManagement } from './entities/fee-management.entity';
import { FeeManagementHistory } from './entities/fee-management-history.entity';
import { QueuePlayerHistory } from '../queue-players/entities/queue-player-history.entity';
import { QueuePlayer } from '../queue-players/entities/queue-player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeManagement, FeeManagementHistory, QueuePlayerHistory, QueuePlayer])],
  controllers: [FeeManagementController],
  providers: [FeeManagementService],
  exports: [FeeManagementService],
})
export class FeeManagementModule {}

