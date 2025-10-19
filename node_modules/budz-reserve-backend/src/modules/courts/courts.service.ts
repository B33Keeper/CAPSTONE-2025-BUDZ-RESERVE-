import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Court, CourtStatus } from './entities/court.entity';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtsService {
  constructor(
    @InjectRepository(Court)
    private courtsRepository: Repository<Court>,
  ) {}

  async create(createCourtDto: CreateCourtDto): Promise<Court> {
    const court = this.courtsRepository.create(createCourtDto);
    return this.courtsRepository.save(court);
  }

  async findAll(): Promise<Court[]> {
    return this.courtsRepository.find({
      order: { Court_Id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Court> {
    const court = await this.courtsRepository.findOne({
      where: { Court_Id: id },
    });

    if (!court) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    return court;
  }

  async update(id: number, updateCourtDto: UpdateCourtDto): Promise<Court> {
    const court = await this.findOne(id);
    await this.courtsRepository.update(id, updateCourtDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const court = await this.findOne(id);
    await this.courtsRepository.remove(court);
  }

  async getAvailableCourts(): Promise<Court[]> {
    return this.courtsRepository.find({
      where: { Status: CourtStatus.AVAILABLE },
      order: { Court_Id: 'ASC' },
    });
  }
}
