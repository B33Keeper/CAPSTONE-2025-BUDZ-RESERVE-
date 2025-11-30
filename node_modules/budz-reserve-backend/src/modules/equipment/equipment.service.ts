import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { EquipmentRentalItem } from '../payments/entities/equipment-rental-item.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(EquipmentRentalItem)
    private equipmentRentalItemRepository: Repository<EquipmentRentalItem>,
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
    const equipmentList = await this.equipmentRepository.find({
      order: { equipment_name: 'ASC' },
    });

    // Calculate available stock for each equipment (total - active rentals)
    const now = new Date();
    const equipmentWithAvailability = await Promise.all(
      equipmentList.map(async (equipment) => {
        // Count active rentals (not expired and stock not restored)
        const activeRentals = await this.equipmentRentalItemRepository.count({
          where: {
            equipment_id: equipment.id,
            rental_end_time: MoreThan(now),
            stock_restored: false,
          },
        });

        // Get total quantity of active rentals
        const activeRentalItems = await this.equipmentRentalItemRepository.find({
          where: {
            equipment_id: equipment.id,
            rental_end_time: MoreThan(now),
            stock_restored: false,
          },
        });

        const activeRentalQuantity = activeRentalItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        // Calculate available stock
        const availableStock = Math.max(equipment.stocks - activeRentalQuantity, 0);

        return {
          ...equipment,
          available_stock: availableStock,
          active_rentals: activeRentalQuantity,
        };
      }),
    );

    return equipmentWithAvailability;
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
