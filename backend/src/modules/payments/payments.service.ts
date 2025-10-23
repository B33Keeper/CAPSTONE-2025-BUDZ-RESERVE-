import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReservationsService } from '../reservations/reservations.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private reservationsService: ReservationsService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Verify reservation exists
    const reservation = await this.reservationsService.findOne(createPaymentDto.reservation_id);
    
    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      transaction_id: transactionId,
      reference_number: reservation.Reference_Number,
    });

    return this.paymentsRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentsRepository.find({
      relations: ['reservation'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['reservation'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByReservation(reservationId: number): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { reservation_id: reservationId },
      relations: ['reservation'],
    });
  }

  async updateStatus(id: number, status: string): Promise<Payment> {
    const payment = await this.findOne(id);
    await this.paymentsRepository.update(id, { status: status as any });
    return this.findOne(id);
  }
}
