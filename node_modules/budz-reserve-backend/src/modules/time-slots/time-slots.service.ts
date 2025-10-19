import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeSlot } from './entities/time-slot.entity';

@Injectable()
export class TimeSlotsService {
  constructor(
    @InjectRepository(TimeSlot)
    private timeSlotsRepository: Repository<TimeSlot>,
  ) {}

  async findAll(): Promise<TimeSlot[]> {
    return this.timeSlotsRepository.find({
      where: { is_active: true },
      order: { start_time: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TimeSlot | null> {
    return this.timeSlotsRepository.findOne({ where: { id } });
  }
}
