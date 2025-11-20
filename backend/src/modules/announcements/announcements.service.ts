import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, userId: number): Promise<Announcement> {
    const announcement = this.announcementsRepository.create({
      ...createAnnouncementDto,
      created_by: userId,
      is_active: createAnnouncementDto.is_active ?? true,
    });

    return await this.announcementsRepository.save(announcement);
  }

  async findLatest(): Promise<Announcement | null> {
    // Get the most recent active announcement
    const announcement = await this.announcementsRepository.findOne({
      where: { is_active: true },
      relations: ['creator'],
      order: { created_at: 'DESC' },
    });

    return announcement;
  }

  async findAll(): Promise<Announcement[]> {
    return await this.announcementsRepository.find({
      relations: ['creator'],
      order: { created_at: 'DESC' },
    });
  }

  async findActive(): Promise<Announcement[]> {
    return await this.announcementsRepository.find({
      where: { is_active: true },
      relations: ['creator'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Announcement> {
    const announcement = await this.announcementsRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  async remove(id: number): Promise<void> {
    const announcement = await this.findOne(id);
    await this.announcementsRepository.remove(announcement);
  }

  async update(id: number, updateDto: Partial<CreateAnnouncementDto>): Promise<Announcement> {
    const announcement = await this.findOne(id);

    Object.assign(announcement, updateDto);
    return await this.announcementsRepository.save(announcement);
  }
}

