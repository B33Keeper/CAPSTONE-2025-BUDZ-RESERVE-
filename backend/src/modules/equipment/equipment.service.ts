import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
  ) {}

  private normalizePayload<T extends Partial<Equipment>>(payload: T): T {
    const normalizeString = (value?: string | null) => {
      if (value === undefined) return undefined as any;
      const trimmed = value?.toString().trim() ?? '';
      return trimmed.length > 0 ? trimmed : null;
    };

    return {
      ...payload,
      unit: normalizeString(payload.unit as string | null),
      weight: normalizeString(payload.weight as string | null),
      tension: normalizeString(payload.tension as string | null),
    };
  }

  async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    const equipment = this.equipmentRepository.create(
      this.normalizePayload(createEquipmentDto),
    );
    return this.equipmentRepository.save(equipment);
  }

  async findAll(): Promise<Equipment[]> {
    return this.equipmentRepository.find({
      order: { equipment_name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    return equipment;
  }

  async update(id: number, updateEquipmentDto: UpdateEquipmentDto): Promise<Equipment> {
    const equipment = await this.findOne(id);
    await this.equipmentRepository.update(id, this.normalizePayload(updateEquipmentDto));
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const equipment = await this.findOne(id);
    await this.equipmentRepository.remove(equipment);
  }

  async getAvailableEquipment(): Promise<Equipment[]> {
    return this.equipmentRepository.find({
      where: { status: 'Available' },
      order: { equipment_name: 'ASC' },
    });
  }
}
