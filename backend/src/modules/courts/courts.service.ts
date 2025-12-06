import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Court, CourtStatus } from './entities/court.entity';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';

@Injectable()
export class CourtsService {
  constructor(
    @InjectRepository(Court)
    private courtsRepository: Repository<Court>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
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
    
    // If Price is being changed, check for pending or active (confirmed) reservations
    if (updateCourtDto.Price !== undefined && updateCourtDto.Price !== court.Price) {
      const activeOrPendingReservations = await this.reservationsRepository.count({
        where: {
          Court_ID: id,
          Status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        },
      });

      if (activeOrPendingReservations > 0) {
        throw new BadRequestException(
          `Cannot modify price. This court has ${activeOrPendingReservations} active or pending reservation(s). Please wait for all reservations to be completed or cancelled.`
        );
      }
    }
    
    await this.courtsRepository.update(id, updateCourtDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const court = await this.findOne(id);
    
    // Check if there are any reservations for this court
    const reservationCount = await this.reservationsRepository.count({
      where: { Court_ID: id },
    });
    
    if (reservationCount > 0) {
      throw new BadRequestException(
        `Cannot delete court "${court.Court_Name}" because it has ${reservationCount} reservation(s) associated with it. Please delete or reassign the reservations first.`
      );
    }
    
    await this.courtsRepository.remove(court);
  }

  async getAvailableCourts(): Promise<Court[]> {
    return this.courtsRepository.find({
      where: { Status: CourtStatus.AVAILABLE },
      order: { Court_Id: 'ASC' },
    });
  }

  async getCourtCount(): Promise<number> {
    return this.courtsRepository.count();
  }

  async getAvailableCourtCount(): Promise<number> {
    return this.courtsRepository.count({
      where: { Status: CourtStatus.AVAILABLE },
    });
  }
}
