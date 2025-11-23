import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueingCourtsController } from './queueing-courts.controller';
import { QueueingCourtsService } from './queueing-courts.service';
import { QueueingCourt } from './entities/queueing-court.entity';
import { QueueMatch } from '../queue-matches/entities/queue-match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QueueingCourt, QueueMatch])],
  controllers: [QueueingCourtsController],
  providers: [QueueingCourtsService],
  exports: [QueueingCourtsService],
})
export class QueueingCourtsModule {}

