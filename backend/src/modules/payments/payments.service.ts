import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { PaymentStatus } from './entities/payment.entity';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(EquipmentRental)
    private equipmentRentalRepository: Repository<EquipmentRental>,
    @InjectRepository(EquipmentRentalItem)
    private equipmentRentalItemRepository: Repository<EquipmentRentalItem>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
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

  async getSalesReport(startDate: Date, endDate: Date) {
    console.log(`[SalesReport Service] Fetching payments between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    
    // Fetch all completed payments (for now, ignore date filter to test)
    let payments;
    try {
      console.log(`[SalesReport Service] Querying payments table...`);
      payments = await this.paymentsRepository.find({
        where: {
          status: PaymentStatus.COMPLETED,
        },
        relations: ['reservation', 'reservation.user', 'reservation.court'],
        order: { created_at: 'DESC' },
      });
      console.log(`[SalesReport Service] Found ${payments.length} completed payments (all time)`);
      
      // Filter by date range after fetching
      const beforeFilter = payments.length;
      payments = payments.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
      console.log(`[SalesReport Service] Filtered from ${beforeFilter} to ${payments.length} payments in date range`);
    } catch (error) {
      console.error(`[SalesReport Service] ERROR fetching payments:`, error);
      console.error(`[SalesReport Service] Error stack:`, error.stack);
      throw error;
    }

    // Build sales report data
    const reportData = [];
    let totalReservations = 0;
    let totalIncome = 0;
    let totalCancellations = 0;

    for (const payment of payments) {
      const reservation = payment.reservation;
      
      if (!reservation) continue;

      totalReservations++;
      const amount = Number(payment.amount);
      totalIncome += amount;

      // Format time
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
      };

      // Format date
      const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      };

      const isCancelled = reservation.Status === 'Cancelled';
      if (isCancelled) {
        totalCancellations++;
      }

      // Fetch equipment rentals for this reservation
      let equipmentRentals: any[] = [];
      try {
        const rental = await this.equipmentRentalRepository.findOne({
          where: { reservation_id: reservation.Reservation_ID },
          relations: ['items'],
        });

        if (rental && rental.items && rental.items.length > 0) {
          const items = await this.equipmentRentalItemRepository.find({
            where: { rental_id: rental.id },
          });

          for (const item of items) {
            const equipment = await this.equipmentRepository.findOne({
              where: { id: item.equipment_id },
            });

            equipmentRentals.push({
              equipmentName: equipment?.equipment_name || 'Equipment',
              quantity: item.quantity,
              hours: item.hours,
            });
          }
        }
      } catch (error) {
        console.error(`[SalesReport Service] Error fetching equipment rentals for reservation ${reservation.Reservation_ID}:`, error);
      }

      reportData.push({
        reservationId: reservation.Reservation_ID,
        customerName: reservation.user?.name || 'Unknown',
        courtName: reservation.court?.Court_Name || 'Unknown',
        time: `${formatTime(reservation.Start_Time)}-${formatTime(reservation.End_Time)}`,
        date: formatDate(payment.created_at || reservation.Reservation_Date),
        paymentMethod: payment.payment_method || 'Unknown',
        price: amount,
        status: isCancelled ? 'cancelled' : 'completed',
        equipmentRentals: equipmentRentals,
      });
    }

    return {
      data: reportData,
      summary: {
        totalReservations,
        totalIncome,
        totalCancellations,
      },
    };
  }
}
