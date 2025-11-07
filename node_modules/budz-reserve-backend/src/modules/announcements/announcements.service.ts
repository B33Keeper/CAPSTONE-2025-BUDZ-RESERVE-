import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement, AnnouncementType } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, userId: number): Promise<Announcement> {
    // When creating a new announcement, deactivate all previous announcements
    // so only the most recent one is shown
    await this.announcementsRepository.update(
      { is_active: true },
      { is_active: false },
    );

    const announcement = this.announcementsRepository.create({
      ...createAnnouncementDto,
      created_by: userId,
      is_active: true,
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
    
    // If activating this announcement, deactivate all others
    if (updateDto.is_active === true) {
      await this.announcementsRepository
        .createQueryBuilder()
        .update(Announcement)
        .set({ is_active: false })
        .where('is_active = :isActive', { isActive: true })
        .andWhere('id != :id', { id })
        .execute();
    }

    Object.assign(announcement, updateDto);
    return await this.announcementsRepository.save(announcement);
  }
}

