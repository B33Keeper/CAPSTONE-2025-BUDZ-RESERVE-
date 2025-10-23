import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../payments/entities/payment.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CourtsService } from '../courts/courts.service';
import { EquipmentService } from '../equipment/equipment.service';
import { PayMongoService } from '../payments/paymongo.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private courtsService: CourtsService,
    private equipmentService: EquipmentService,
    private payMongoService: PayMongoService,
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

  async createFromPayment(paymentData: any): Promise<Reservation[]> {
    try {
      const { bookingData, paymentId, amount, paymentMethod } = paymentData;
      console.log('=== CREATE FROM PAYMENT DEBUG ===');
      console.log('Payment Data received:', { paymentId, amount, paymentMethod });
      console.log('Payment ID type:', typeof paymentId);
      console.log('Payment ID starts with cs_:', paymentId?.startsWith?.('cs_'));
      const reservations: Reservation[] = [];

      // Get actual payment method from Paymongo
      let actualPaymentMethod = 'gcash'; // Default fallback
      
      try {
        console.log('Processing checkout session ID:', paymentId);
        
        // Check if this is a checkout session ID (starts with 'cs_')
        if (paymentId.startsWith('cs_')) {
          console.log('Detected checkout session, fetching session details...');
          const checkoutSession = await this.payMongoService.getCheckoutSession(paymentId);
          console.log('Checkout session details:', checkoutSession.attributes);
          
          // Get the payment from the checkout session
          const payments = checkoutSession.attributes.payments;
          if (payments && payments.length > 0) {
            const paymentIdFromSession = payments[0].id;
            console.log('Found payment ID from session:', paymentIdFromSession);
            
            // Get payment details
            const payment = await this.payMongoService.getPayment(paymentIdFromSession);
            console.log('Payment details:', payment.attributes);
            
            // Get payment method ID from the payment source
            const paymentMethodId = payment.attributes.source?.id;
            if (paymentMethodId) {
              console.log('Found payment method ID from payment:', paymentMethodId);
              
              // Get payment method details
              const paymentMethodDetails = await this.payMongoService.getPaymentMethod(paymentMethodId);
              actualPaymentMethod = paymentMethodDetails.attributes.type;
              console.log('Fetched payment method from Paymongo:', actualPaymentMethod);
            } else {
              console.log('No payment method ID found in payment source');
            }
          } else {
            console.log('No payments found in checkout session');
          }
        } else {
          console.log('Not a checkout session ID, using default payment method');
        }
      } catch (error) {
        console.error('Error fetching payment method from Paymongo:', error);
        actualPaymentMethod = 'gcash'; // Default fallback
      }

      // Create reservations for each court booking
      for (const courtBooking of bookingData.courtBookings || []) {
        // Find court by name (you might need to adjust this based on your court data)
        const courts = await this.courtsService.findAll();
        const court = courts.find(c => c.Court_Name === courtBooking.court);
        
        if (!court) {
          throw new BadRequestException(`Court "${courtBooking.court}" not found`);
        }

        // Parse schedule to get start and end times
        const [startTime, endTime] = this.parseScheduleToTimes(courtBooking.schedule);

        // Get the actual payment ID for reference
        let actualPaymentId = paymentId;
        if (paymentId.startsWith('cs_')) {
          // For checkout sessions, we'll use the checkout session ID as reference
          // since we don't have the actual payment ID yet
          actualPaymentId = paymentId;
        }

        const reservation = this.reservationsRepository.create({
          User_ID: bookingData.userId,
          Court_ID: court.Court_Id,
          Reservation_Date: new Date(bookingData.selectedDate),
          Start_Time: startTime,
          End_Time: endTime,
          Total_Amount: courtBooking.subtotal,
          Reference_Number: bookingData.referenceNumber || `REF${Date.now()}`,
          Paymongo_Reference_Number: actualPaymentId,
          Notes: `Payment via Paymongo - ${actualPaymentId}`,
          Status: ReservationStatus.CONFIRMED,
        });

        const savedReservation = await this.reservationsRepository.save(reservation);
        reservations.push(savedReservation);

        // Create payment record for this reservation
        await this.createPaymentRecord(savedReservation, actualPaymentId, amount, bookingData, actualPaymentMethod);
      }

      return reservations;
    } catch (error) {
      throw new BadRequestException(`Failed to create reservations from payment: ${error.message}`);
    }
  }

  private parseScheduleToTimes(schedule: string): [string, string] {
    // Parse schedule like "9:00 AM - 10:00 AM" to "09:00:00" and "10:00:00"
    const timeMatch = schedule.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    
    if (!timeMatch) {
      // Default to 1-hour slot if parsing fails
      return ['09:00:00', '10:00:00'];
    }

    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
    
    const startTime = this.convertTo24Hour(parseInt(startHour), startPeriod, parseInt(startMin));
    const endTime = this.convertTo24Hour(parseInt(endHour), endPeriod, parseInt(endMin));
    
    return [startTime, endTime];
  }

  private convertTo24Hour(hour: number, period: string, minute: number): string {
    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  }

  private async createPaymentRecord(reservation: Reservation, paymentId: string, amount: number, bookingData: any, paymentMethod: string) {
    try {
      // Map payment method string to enum
      const mappedPaymentMethod = this.mapPaymentMethod(paymentMethod);
      
      // Create payment record in database
      const payment = this.paymentRepository.create({
        reservation_id: reservation.Reservation_ID,
        amount: amount,
        payment_method: mappedPaymentMethod,
        transaction_id: paymentId,
        reference_number: `REF${Date.now()}`,
        notes: `Payment via Paymongo - ${paymentId}`,
        status: PaymentStatus.COMPLETED,
      });

      const savedPayment = await this.paymentRepository.save(payment);
      console.log(`Created payment record ${savedPayment.id} for reservation ${reservation.Reservation_ID}`);
      
      return savedPayment;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }

  private mapPaymentMethod(paymentMethod: string): PaymentMethod {
    switch (paymentMethod?.toLowerCase()) {
      case 'gcash':
        return PaymentMethod.GCASH;
      case 'paymaya':
        return PaymentMethod.MAYA;
      case 'grab_pay':
        return PaymentMethod.GRABPAY;
      case 'card':
        return PaymentMethod.BANKING;
      default:
        return PaymentMethod.GCASH; // Default fallback
    }
  }
}
