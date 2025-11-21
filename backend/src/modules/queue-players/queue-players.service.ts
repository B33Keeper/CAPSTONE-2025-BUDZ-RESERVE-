import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueuePlayer } from './entities/queue-player.entity';
import { QueuePlayerHistory } from './entities/queue-player-history.entity';
import { CreateQueuePlayerDto } from './dto/create-queue-player.dto';
import { UpdateQueuePlayerDto } from './dto/update-queue-player.dto';

@Injectable()
export class QueuePlayersService {
  constructor(
    @InjectRepository(QueuePlayer)
    private readonly queuePlayersRepository: Repository<QueuePlayer>,
    @InjectRepository(QueuePlayerHistory)
    private readonly queuePlayersHistoryRepository: Repository<QueuePlayerHistory>,
  ) {}

  findAll(userId: number): Promise<QueuePlayer[]> {
    return this.queuePlayersRepository.find({
      where: { userId },
      order: {
        name: 'ASC',
      },
    });
  }

  async create(createQueuePlayerDto: CreateQueuePlayerDto, userId: number): Promise<QueuePlayer> {
    // Get today's date in local timezone (date only, no time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const player = this.queuePlayersRepository.create({
      ...createQueuePlayerDto,
      userId,
      status: createQueuePlayerDto.status ?? 'In Queue',
      gamesPlayed: 0,
      // Always set lastPlayed to today when creating a new player
      // This ensures they stay in the queue until the day ends
      lastPlayed: createQueuePlayerDto.lastPlayed
        ? new Date(createQueuePlayerDto.lastPlayed)
        : today,
    });

    return this.queuePlayersRepository.save(player);
  }

  async update(id: number, updateDto: UpdateQueuePlayerDto, userId: number): Promise<QueuePlayer> {
    const player = await this.queuePlayersRepository.findOne({ where: { id, userId } });

    if (!player) {
      throw new NotFoundException(`Queue player with id ${id} not found`);
    }

    if (updateDto.name !== undefined) {
      player.name = updateDto.name;
    }

    if (updateDto.skill !== undefined) {
      player.skill = updateDto.skill;
    }

    if (updateDto.sex !== undefined) {
      player.sex = updateDto.sex;
    }

    if (updateDto.status !== undefined) {
      player.status = updateDto.status;
    }

    return this.queuePlayersRepository.save(player);
  }

  async remove(id: number, userId: number): Promise<void> {
    const result = await this.queuePlayersRepository.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException(`Queue player with id ${id} not found`);
    }
  }

  /**
   * Get all history records for a user, grouped by archivedAt date
   * @param userId - The user ID to filter history records
   * @returns Array of history records ordered by archivedAt descending
   */
  async findHistory(userId: number): Promise<QueuePlayerHistory[]> {
    return this.queuePlayersHistoryRepository.find({
      where: { userId },
      order: {
        archivedAt: 'DESC',
        name: 'ASC',
      },
    });
  }

  /**
   * Migrate players with user_id = 0 to the current user
   * This helps fix players that were created before user_id was properly set
   * @param userId - The user ID to assign the players to
   * @returns Number of players migrated
   */
  async migratePlayersToUser(userId: number): Promise<number> {
    const result = await this.queuePlayersRepository.update(
      { userId: 0 },
      { userId },
    );
    return result.affected || 0;
  }
}

