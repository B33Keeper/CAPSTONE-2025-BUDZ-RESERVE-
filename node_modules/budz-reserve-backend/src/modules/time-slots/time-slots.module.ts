import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlotsService } from './time-slots.service';
import { TimeSlotsController } from './time-slots.controller';
import { TimeSlot } from './entities/time-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeSlot])],
  controllers: [TimeSlotsController],
  providers: [TimeSlotsService],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
