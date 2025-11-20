import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueingCourtsController } from './queueing-courts.controller';
import { QueueingCourtsService } from './queueing-courts.service';
import { QueueingCourt } from './entities/queueing-court.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QueueingCourt])],
  controllers: [QueueingCourtsController],
  providers: [QueueingCourtsService],
  exports: [QueueingCourtsService],
})
export class QueueingCourtsModule {}

