import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gallery } from './entities/gallery.entity';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Gallery)
    private galleryRepository: Repository<Gallery>,
  ) {}

  async create(createGalleryDto: CreateGalleryDto): Promise<Gallery> {
    const gallery = this.galleryRepository.create(createGalleryDto);
    return this.galleryRepository.save(gallery);
  }

  async findAll(): Promise<Gallery[]> {
    return this.galleryRepository.find({
      where: { status: 'active' },
      order: { sort_order: 'ASC', created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Gallery> {
    const gallery = await this.galleryRepository.findOne({
      where: { id },
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery item with ID ${id} not found`);
    }

    return gallery;
  }

  async update(id: number, updateGalleryDto: UpdateGalleryDto): Promise<Gallery> {
    const gallery = await this.findOne(id);
    Object.assign(gallery, updateGalleryDto);
    return this.galleryRepository.save(gallery);
  }

  async remove(id: number): Promise<void> {
    const gallery = await this.findOne(id);
    await this.galleryRepository.remove(gallery);
  }

  async updateStatus(id: number, status: string): Promise<Gallery> {
    const gallery = await this.findOne(id);
    gallery.status = status;
    return this.galleryRepository.save(gallery);
  }

  async reorder(ids: number[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.galleryRepository.update(ids[i], { sort_order: i + 1 });
    }
  }
}
