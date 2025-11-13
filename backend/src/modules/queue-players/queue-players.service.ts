import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueuePlayer } from './entities/queue-player.entity';
import { CreateQueuePlayerDto } from './dto/create-queue-player.dto';
import { UpdateQueuePlayerDto } from './dto/update-queue-player.dto';

@Injectable()
export class QueuePlayersService {
  constructor(
    @InjectRepository(QueuePlayer)
    private readonly queuePlayersRepository: Repository<QueuePlayer>,
  ) {}

  findAll(): Promise<QueuePlayer[]> {
    return this.queuePlayersRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async create(createQueuePlayerDto: CreateQueuePlayerDto): Promise<QueuePlayer> {
    const player = this.queuePlayersRepository.create({
      ...createQueuePlayerDto,
      status: createQueuePlayerDto.status ?? 'In Queue',
      gamesPlayed: 0,
      lastPlayed: createQueuePlayerDto.lastPlayed
        ? new Date(createQueuePlayerDto.lastPlayed)
        : new Date(),
    });

    return this.queuePlayersRepository.save(player);
  }

  async update(id: number, updateDto: UpdateQueuePlayerDto): Promise<QueuePlayer> {
    const player = await this.queuePlayersRepository.findOne({ where: { id } });

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

  async remove(id: number): Promise<void> {
    const result = await this.queuePlayersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Queue player with id ${id} not found`);
    }
  }
}

