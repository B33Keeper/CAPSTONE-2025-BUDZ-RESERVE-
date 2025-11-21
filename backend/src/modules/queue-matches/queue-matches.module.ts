import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueMatchesController } from './queue-matches.controller';
import { QueueMatchesService } from './queue-matches.service';
import { QueueMatch } from './entities/queue-match.entity';
import { QueueMatchHistory } from './entities/queue-match-history.entity';
import { QueuePlayer } from '../queue-players/entities/queue-player.entity';
import { QueueingCourt } from '../queueing-courts/entities/queueing-court.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QueueMatch, QueueMatchHistory, QueuePlayer, QueueingCourt])],
  controllers: [QueueMatchesController],
  providers: [QueueMatchesService],
  exports: [QueueMatchesService],
})
export class QueueMatchesModule {}

