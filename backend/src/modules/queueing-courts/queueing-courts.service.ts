import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  QueueingCourt,
  QueueingCourtStatus,
} from './entities/queueing-court.entity';
import { QueueMatch, QueueMatchStatus } from '../queue-matches/entities/queue-match.entity';
import { CreateQueueingCourtDto } from './dto/create-queueing-court.dto';

@Injectable()
export class QueueingCourtsService {
  constructor(
    @InjectRepository(QueueingCourt)
    private readonly queueingCourtsRepository: Repository<QueueingCourt>,
    @InjectRepository(QueueMatch)
    private readonly queueMatchesRepository: Repository<QueueMatch>,
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
    const court = await this.queueingCourtsRepository.findOne({ where: { id } });
    if (!court) {
      throw new NotFoundException(`Queueing court with id ${id} not found.`);
    }

    // Only prevent deletion if there is an ACTIVE match on this court
    // PENDING matches can be reassigned, COMPLETED/CANCELLED matches don't matter
    const hasActiveMatch = await this.queueMatchesRepository.exist({
      where: {
        courtId: id,
        status: QueueMatchStatus.ACTIVE,
      },
    });

    if (hasActiveMatch) {
      throw new BadRequestException(
        'Court cannot be deleted while a match is currently active on it.',
      );
    }

    // Clear court references from all matches (pending, completed, cancelled)
    // This allows pending matches to be reassigned later
    await this.queueMatchesRepository
      .createQueryBuilder()
      .update()
      .set({ courtId: null, courtName: null })
      .where('court_id = :id', { id })
      .execute();

    await this.queueingCourtsRepository.delete(id);
  }

  async removeAll(): Promise<void> {
    // Only prevent clearing all courts if there are ACTIVE matches
    // PENDING matches can be reassigned, COMPLETED/CANCELLED matches don't matter
    const hasActiveMatches = await this.queueMatchesRepository.count({
      where: { status: QueueMatchStatus.ACTIVE },
    });

    if (hasActiveMatches > 0) {
      throw new BadRequestException(
        'Cannot clear courts while there are active matches in progress.',
      );
    }

    // Clear court references from all matches (pending, completed, cancelled)
    // This allows pending matches to be reassigned later
    await this.queueMatchesRepository
      .createQueryBuilder()
      .update()
      .set({ courtId: null, courtName: null })
      .where('court_id IS NOT NULL')
      .execute();

    // Use query builder to delete all records instead of clear() which uses TRUNCATE
    // TRUNCATE cannot be used on tables with foreign key constraints
    await this.queueingCourtsRepository
      .createQueryBuilder()
      .delete()
      .execute();
  }
}

