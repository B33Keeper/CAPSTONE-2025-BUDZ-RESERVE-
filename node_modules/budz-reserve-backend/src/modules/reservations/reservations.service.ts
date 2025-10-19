import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CourtsService } from '../courts/courts.service';
import { EquipmentService } from '../equipment/equipment.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    private courtsService: CourtsService,
    private equipmentService: EquipmentService,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: number): Promise<Reservation> {
    // Check if court exists and is available
    const court = await this.courtsService.findOne(createReservationDto.Court_ID);
    if (court.Status !== 'Available') {
      throw new BadRequestException('Court is not available for reservation');
    }

    // Check for time conflicts
    const existingReservation = await this.reservationsRepository.findOne({
      where: {
        Court_ID: createReservationDto.Court_ID,
        Reservation_Date: new Date(createReservationDto.Reservation_Date),
        Status: ReservationStatus.CONFIRMED,
        Start_Time: Between(createReservationDto.Start_Time, createReservationDto.End_Time),
      },
    });

    if (existingReservation) {
      throw new BadRequestException('Time slot is already reserved');
    }

    // Calculate total amount
    let totalAmount = court.Price;
    
    // Add equipment costs if provided
    if (createReservationDto.equipment && createReservationDto.equipment.length > 0) {
      for (const item of createReservationDto.equipment) {
        const equipment = await this.equipmentService.findOne(item.equipment_id);
        totalAmount += equipment.price * item.quantity;
      }
    }

    // Generate reference number
    const referenceNumber = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const reservation = this.reservationsRepository.create({
      ...createReservationDto,
      User_ID: userId,
      Total_Amount: totalAmount,
      Reference_Number: referenceNumber,
    });

    return this.reservationsRepository.save(reservation);
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationsRepository.find({
      relations: ['user', 'court'],
      order: { Created_at: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Reservation[]> {
    return this.reservationsRepository.find({
      where: { User_ID: userId },
      relations: ['court', 'payments'],
      order: { Created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { Reservation_ID: id },
      relations: ['user', 'court'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async update(id: number, updateReservationDto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);
    await this.reservationsRepository.update(id, updateReservationDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationsRepository.remove(reservation);
  }

  async getAvailability(courtId: number, date: string): Promise<any[]> {
    const reservations = await this.reservationsRepository.find({
      where: {
        Court_ID: courtId,
        Reservation_Date: new Date(date),
        Status: ReservationStatus.CONFIRMED,
      },
      select: ['Start_Time', 'End_Time'],
    });

    // Generate time slots (8 AM to 11 PM, 1-hour slots)
    const timeSlots = [];
    for (let hour = 8; hour < 23; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
      
      const isReserved = reservations.some(res => 
        res.Start_Time <= startTime && res.End_Time > startTime
      );

      timeSlots.push({
        start_time: startTime,
        end_time: endTime,
        available: !isReserved,
      });
    }

    return timeSlots;
  }
}
