import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  QueueingCourt,
  QueueingCourtStatus,
} from './entities/queueing-court.entity';
import { CreateQueueingCourtDto } from './dto/create-queueing-court.dto';

@Injectable()
export class QueueingCourtsService {
  constructor(
    @InjectRepository(QueueingCourt)
    private readonly queueingCourtsRepository: Repository<QueueingCourt>,
  ) {}

  async create(
    createQueueingCourtDto: CreateQueueingCourtDto,
  ): Promise<QueueingCourt> {
    const existingCourt = await this.queueingCourtsRepository.findOne({
      where: { name: createQueueingCourtDto.name },
    });

    if (existingCourt) {
      throw new ConflictException('Court name already exists.');
    }

    const court = this.queueingCourtsRepository.create({
      ...createQueueingCourtDto,
      status:
        createQueueingCourtDto.status ?? QueueingCourtStatus.AVAILABLE,
    });
    return this.queueingCourtsRepository.save(court);
  }

  async findAll(): Promise<QueueingCourt[]> {
    return this.queueingCourtsRepository.find({
      order: { id: 'ASC' },
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.queueingCourtsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Queueing court with id ${id} not found.`);
    }
  }

  async removeAll(): Promise<void> {
    await this.queueingCourtsRepository.clear();
  }
}

