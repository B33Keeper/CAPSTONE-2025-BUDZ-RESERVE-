import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, Or } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { EquipmentRentalItem } from '../payments/entities/equipment-rental-item.entity';
import { EquipmentRental } from '../payments/entities/equipment-rental.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(EquipmentRentalItem)
    private equipmentRentalItemRepository: Repository<EquipmentRentalItem>,
    @InjectRepository(EquipmentRental)
    private equipmentRentalRepository: Repository<EquipmentRental>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
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
    
    // If status is being changed and there are active/pending rentals, prevent the change
    if (updateEquipmentDto.status && updateEquipmentDto.status !== equipment.status) {
      const hasRentals = await this.hasActiveOrPendingRentals(id);
      if (hasRentals) {
        throw new BadRequestException(
          'Cannot change status. This racket has active or pending rentals. Please wait for all rentals to be completed or cancelled.'
        );
      }
    }
    
    await this.equipmentRepository.update(id, this.normalizePayload(updateEquipmentDto));
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const equipment = await this.findOne(id);
    
    // Check for active or pending rentals
    const now = new Date();
    
    // Check for active rentals (rental_end_time > now AND stock_restored = false)
    const activeRentals = await this.equipmentRentalItemRepository
      .createQueryBuilder('item')
      .where('item.equipment_id = :equipmentId', { equipmentId: id })
      .andWhere('item.rental_end_time > :now', { now })
      .andWhere('item.stock_restored = :stockRestored', { stockRestored: false })
      .getCount();

    if (activeRentals > 0) {
      throw new BadRequestException(
        `Cannot delete this racket. It has ${activeRentals} active rental(s). Please wait for all rentals to be completed and stock restored.`
      );
    }

    // Check for pending/confirmed rentals (rentals associated with PENDING or CONFIRMED reservations)
    const pendingOrConfirmedRentals = await this.equipmentRentalItemRepository
      .createQueryBuilder('item')
      .innerJoin(EquipmentRental, 'rental', 'rental.id = item.rental_id')
      .innerJoin(Reservation, 'reservation', 'reservation.Reservation_ID = rental.reservation_id')
      .where('item.equipment_id = :equipmentId', { equipmentId: id })
      .andWhere('reservation.Status IN (:...statuses)', {
        statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
      })
      .andWhere('(item.rental_end_time IS NULL OR item.rental_end_time > :now)', { now })
      .andWhere('item.stock_restored = :stockRestored', { stockRestored: false })
      .getCount();

    if (pendingOrConfirmedRentals > 0) {
      throw new BadRequestException(
        `Cannot delete this racket. It has ${pendingOrConfirmedRentals} pending or confirmed rental(s). Please wait for all rentals to be completed or cancelled.`
      );
    }

    await this.equipmentRepository.remove(equipment);
  }

  async getAvailableEquipment(): Promise<Equipment[]> {
    return this.equipmentRepository.find({
      where: { status: 'Available' },
      order: { equipment_name: 'ASC' },
    });
  }

  async hasActiveOrPendingRentals(id: number): Promise<boolean> {
    const now = new Date();
    
    // Check for active rentals (rental_end_time > now AND stock_restored = false)
    const activeRentals = await this.equipmentRentalItemRepository
      .createQueryBuilder('item')
      .where('item.equipment_id = :equipmentId', { equipmentId: id })
      .andWhere('item.rental_end_time > :now', { now })
      .andWhere('item.stock_restored = :stockRestored', { stockRestored: false })
      .getCount();

    if (activeRentals > 0) {
      return true;
    }

    // Check for pending/confirmed rentals (rentals associated with PENDING or CONFIRMED reservations)
    const pendingOrConfirmedRentals = await this.equipmentRentalItemRepository
      .createQueryBuilder('item')
      .innerJoin(EquipmentRental, 'rental', 'rental.id = item.rental_id')
      .innerJoin(Reservation, 'reservation', 'reservation.Reservation_ID = rental.reservation_id')
      .where('item.equipment_id = :equipmentId', { equipmentId: id })
      .andWhere('reservation.Status IN (:...statuses)', {
        statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
      })
      .andWhere('(item.rental_end_time IS NULL OR item.rental_end_time > :now)', { now })
      .andWhere('item.stock_restored = :stockRestored', { stockRestored: false })
      .getCount();

    return pendingOrConfirmedRentals > 0;
  }
}
