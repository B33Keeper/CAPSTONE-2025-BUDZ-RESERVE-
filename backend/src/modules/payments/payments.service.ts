import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
    private usersService: UsersService,
    private mailerService: MailerService,
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
    
    // If payment is completed, send email receipt
    if (status === 'Completed' || status === 'completed') {
      await this.sendReceiptEmail(payment);
    }
    
    return this.findOne(id);
  }

  async finalizePayment(
    reservationData: any,
    paymentIntentId: string,
    amount: number,
    paymentMethod: string,
    userId: number,
  ): Promise<{ reservation: any; payment: Payment }> {
    try {
      // Create reservation
      const reservation = await this.reservationsService.create(reservationData, userId);

      // Create payment
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const payment = this.paymentsRepository.create({
        reservation_id: reservation.Reservation_ID,
        amount,
        payment_method: paymentMethod as any,
        status: 'Completed' as any,
        transaction_id: transactionId,
        reference_number: reservation.Reference_Number,
      });

      const savedPayment = await this.paymentsRepository.save(payment);

      // Send email receipt
      await this.sendReceiptEmail(savedPayment);

      return { reservation, payment: savedPayment };
    } catch (error) {
      this.logger.error('Error finalizing payment:', error);
      throw error;
    }
  }

  async sendReceiptEmail(payment: Payment): Promise<void> {
    try {
      // Get payment with reservation details
      const paymentWithDetails = await this.paymentsRepository.findOne({
        where: { id: payment.id },
        relations: ['reservation'],
      });

      if (!paymentWithDetails || !paymentWithDetails.reservation) {
        this.logger.error('Cannot send receipt: Payment or reservation not found');
        return;
      }

      // Get user details
      const user = await this.usersService.findOne(paymentWithDetails.reservation.User_ID);

      if (!user || !user.email) {
        this.logger.error('Cannot send receipt: User or email not found');
        return;
      }

      // Format date and time
      const paymentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const bookingDate = new Date(paymentWithDetails.reservation.Reservation_Date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send email
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Payment Receipt - Budz Reserve',
        template: 'payment-receipt',
        context: {
          userName: user.name || user.username,
          paymentMethod: paymentWithDetails.payment_method,
          referenceNumber: paymentWithDetails.reference_number || 'N/A',
          transactionId: paymentWithDetails.transaction_id || 'N/A',
          paymentDate,
          totalAmount: paymentWithDetails.amount.toFixed(2),
          courtName: 'Court ' + paymentWithDetails.reservation.Court_ID,
          bookingDate,
          startTime: paymentWithDetails.reservation.Start_Time,
          endTime: paymentWithDetails.reservation.End_Time,
        },
      });

      this.logger.log(`Payment receipt email sent to ${user.email}`);
    } catch (error) {
      this.logger.error('Failed to send payment receipt email:', error);
      // Don't throw - email failure shouldn't break the payment flow
    }
  }
}
