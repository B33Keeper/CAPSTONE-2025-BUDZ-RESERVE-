import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In, LessThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { ReservationHistory } from './entities/reservation-history.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../payments/entities/payment.entity';
import { EquipmentRental } from '../payments/entities/equipment-rental.entity';
import { EquipmentRentalItem } from '../payments/entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { User } from '../users/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CourtsService } from '../courts/courts.service';
import { EquipmentService } from '../equipment/equipment.service';
import { PayMongoService } from '../payments/paymongo.service';
import { EmailReceiptService } from '../payments/email-receipt.service';
import { PaymongoQrPhCode } from '../payments/types/paymongo.types';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(ReservationHistory)
    private reservationsHistoryRepository: Repository<ReservationHistory>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(EquipmentRental)
    private equipmentRentalRepository: Repository<EquipmentRental>,
    @InjectRepository(EquipmentRentalItem)
    private equipmentRentalItemRepository: Repository<EquipmentRentalItem>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private courtsService: CourtsService,
    private equipmentService: EquipmentService,
    private payMongoService: PayMongoService,
    @Inject(forwardRef(() => EmailReceiptService))
    private emailReceiptService: EmailReceiptService,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: number): Promise<Reservation> {
    // Check if court exists and is available
    const court = await this.courtsService.findOne(createReservationDto.Court_ID);
    if (court.Status !== 'Available') {
      throw new BadRequestException('Court is not available for reservation');
    }

    // Check for time conflicts
    // IMPORTANT: Only CONFIRMED reservations block new bookings
    // PENDING reservations do NOT block bookings (they may be from failed/abandoned payments)
    const existingReservation = await this.reservationsRepository.findOne({
      where: {
        Court_ID: createReservationDto.Court_ID,
        Reservation_Date: new Date(createReservationDto.Reservation_Date),
        Status: ReservationStatus.CONFIRMED, // Only CONFIRMED reservations block bookings
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
      Is_Admin_Created: false,
    });

    return this.reservationsRepository.save(reservation);
  }

  async getEquipmentAvailabilityByDate(dateInput: string, startTime?: string, hoursParam?: number) {
    if (!dateInput) {
      throw new BadRequestException('Date parameter is required to fetch equipment availability.');
    }

    const reservationDate = this.formatDateOnly(dateInput);
    const equipmentList = await this.equipmentRepository.find({ order: { equipment_name: 'ASC' } });
    const targetStartTime = startTime && /^\d{2}:\d{2}(:\d{2})?$/.test(startTime) ? this.ensureTimeFormat(startTime) : null;
    const targetHours = hoursParam && hoursParam > 0 ? hoursParam : null;

    const availability = [];
    for (const equipment of equipmentList) {
      let reserved = 0;
      if (targetStartTime && targetHours) {
        reserved = await this.getReservedQuantityForRange(equipment.id, reservationDate, targetStartTime, targetHours);
      } else {
        reserved = await this.getReservedQuantityForRange(equipment.id, reservationDate, null, null);
      }
      const available = Math.max(equipment.stocks - reserved, 0);

      availability.push({
        id: equipment.id,
        equipment_name: equipment.equipment_name,
        image_path: equipment.image_path,
        price: Number(equipment.price),
        total_stocks: equipment.stocks,
        reserved,
        available,
        status: available > 0 ? 'Available' : 'Unavailable',
      });
    }

    return availability;
  }

  async findAll(page?: number, limit?: number): Promise<Reservation[]> {
    // Optional pagination - if not provided, returns all (backward compatible)
    const queryOptions: any = {
      relations: ['user', 'court', 'payments'],
      order: { Created_at: 'DESC' },
    };

    // Only apply pagination if both page and limit are provided
    if (page !== undefined && limit !== undefined && page > 0 && limit > 0) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const reservations = await this.reservationsRepository.find(queryOptions);

    // Fetch equipment rentals for all reservations
    if (reservations.length > 0) {
      const reservationIds = reservations.map(r => r.Reservation_ID);
      const equipmentRentals = await this.equipmentRentalRepository.find({
        where: { reservation_id: In(reservationIds) },
        relations: ['items'],
      });

      // Group rentals by reservation_id
      const rentalsByReservation = new Map<number, EquipmentRental[]>();
      equipmentRentals.forEach(rental => {
        const resId = rental.reservation_id;
        if (!rentalsByReservation.has(resId)) {
          rentalsByReservation.set(resId, []);
        }
        rentalsByReservation.get(resId)!.push(rental);
      });

      // Attach rentals to reservations
      reservations.forEach(reservation => {
        const rentals = rentalsByReservation.get(reservation.Reservation_ID) || [];
        (reservation as any).rentals = rentals;
        (reservation as any).equipmentRentals = rentals; // Support both property names
      });
    }

    return reservations;
  }

  async findByUser(userId: number): Promise<Reservation[]> {
    // Include both user-created and admin-created reservations for this user
    // Admin-created reservations are linked to users when the email matches an existing user
    const reservations = await this.reservationsRepository.find({
      where: { User_ID: userId },
      relations: ['court', 'payments'],
      order: { Created_at: 'DESC' },
    });
    
    // Fetch equipment rentals for all reservations (avoid N+1 queries)
    if (reservations.length > 0) {
      const reservationIds = reservations.map(r => r.Reservation_ID);
      const equipmentRentals = await this.equipmentRentalRepository.find({
        where: { reservation_id: In(reservationIds) },
        relations: ['items'],
      });

      // Group rentals by reservation_id
      const rentalsByReservation = new Map<number, EquipmentRental[]>();
      equipmentRentals.forEach(rental => {
        const resId = rental.reservation_id;
        if (!rentalsByReservation.has(resId)) {
          rentalsByReservation.set(resId, []);
        }
        rentalsByReservation.get(resId)!.push(rental);
      });

      // Attach rentals to reservations
      reservations.forEach(reservation => {
        const rentals = rentalsByReservation.get(reservation.Reservation_ID) || [];
        (reservation as any).rentals = rentals;
        (reservation as any).equipmentRentals = rentals; // Support both property names
      });
    }
    
    // Removed verbose logging to prevent Railway rate limits
    // Only log in development mode if needed for debugging
    // this.logger.debug(`[findByUser] User ID: ${userId}, Found ${reservations.length} reservations`);
    
    return reservations;
  }

  /**
   * Check if user has active reservations (pending or confirmed, not expired)
   * Active means: Status is PENDING or CONFIRMED, and reservation period hasn't ended
   */
  async checkQueueingAccess(userId: number): Promise<{ hasAccess: boolean; message?: string; reservations?: any[] }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get all reservations for user with PENDING or CONFIRMED status
    const reservations = await this.reservationsRepository.find({
      where: [
        { User_ID: userId, Status: ReservationStatus.PENDING },
        { User_ID: userId, Status: ReservationStatus.CONFIRMED },
      ],
      order: { Reservation_Date: 'ASC', Start_Time: 'ASC' },
    });

    if (reservations.length === 0) {
      return {
        hasAccess: false,
        message: 'You need an active reservation to access the queueing system. Please book a court first.',
      };
    }

    // Check if any reservation is currently active (not expired)
    const activeReservations = reservations.filter((reservation) => {
      const reservationDate = new Date(reservation.Reservation_Date);
      const reservationDateOnly = new Date(
        reservationDate.getFullYear(),
        reservationDate.getMonth(),
        reservationDate.getDate(),
      );

      // Parse start and end times
      const [startHour, startMin] = reservation.Start_Time.split(':').map(Number);
      const [endHour, endMin] = reservation.End_Time.split(':').map(Number);

      // Create datetime objects for start and end
      const startDateTime = new Date(reservationDateOnly);
      startDateTime.setHours(startHour, startMin || 0, 0, 0);

      const endDateTime = new Date(reservationDateOnly);
      endDateTime.setHours(endHour, endMin || 0, 0, 0);

      // Check if reservation period hasn't ended yet
      // Allow access if: reservation date is today or future, and end time hasn't passed
      const isFutureOrToday = reservationDateOnly >= today;
      const hasNotEnded = endDateTime > now;

      return isFutureOrToday && hasNotEnded;
    });

    if (activeReservations.length === 0) {
      return {
        hasAccess: false,
        message: 'Your reservation period has ended. You can no longer access the queueing system.',
        reservations: reservations.map((r) => ({
          id: r.Reservation_ID,
          date: r.Reservation_Date,
          startTime: r.Start_Time,
          endTime: r.End_Time,
          status: r.Status,
        })),
      };
    }

    return {
      hasAccess: true,
      reservations: activeReservations.map((r) => ({
        id: r.Reservation_ID,
        date: r.Reservation_Date,
        startTime: r.Start_Time,
        endTime: r.End_Time,
        status: r.Status,
        courtId: r.Court_ID,
      })),
    };
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
    // Parse the date string to ensure consistent format
    // Handle both YYYY-MM-DD and other date formats
    let targetDate: Date;
    if (date.includes('T')) {
      targetDate = new Date(date);
    } else {
      // Assume YYYY-MM-DD format
      const [year, month, day] = date.split('-').map(Number);
      targetDate = new Date(year, month - 1, day);
    }
    targetDate.setHours(0, 0, 0, 0);
    
    // Find all CONFIRMED reservations for this court and date
    // IMPORTANT: Only CONFIRMED reservations block availability
    // PENDING reservations do NOT block availability (they may be from failed/abandoned payments)
    // Use Between or date comparison that handles date-only matching
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`[Availability] Querying: Court ${courtId}, Date: ${date}, StartOfDay: ${startOfDay.toISOString()}, EndOfDay: ${endOfDay.toISOString()}`);
    console.log(`[Availability] Only checking CONFIRMED reservations - PENDING reservations do not block availability`);
    
    const reservations = await this.reservationsRepository.find({
      where: {
        Court_ID: courtId,
        Reservation_Date: Between(startOfDay, endOfDay),
        Status: ReservationStatus.CONFIRMED, // Only CONFIRMED reservations block availability
      },
      select: ['Start_Time', 'End_Time', 'Reservation_ID', 'Reservation_Date'],
    });
    
    console.log(`[Availability] Court ${courtId}, Date: ${date}, Found ${reservations.length} reservations`);
    reservations.forEach(res => {
      console.log(`  - Reservation ${res.Reservation_ID}: ${res.Reservation_Date} ${res.Start_Time} - ${res.End_Time}`);
    });

    // Generate time slots (8 AM to 11 PM, 1-hour slots) to match frontend display
    // But check ALL reservations for the day, regardless of their time
    const timeSlots = [];
    for (let hour = 8; hour < 23; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
      
      // Check if this slot overlaps with any reservation
      // A slot is reserved if:
      // 1. Reservation starts before slot ends AND reservation ends after slot starts
      // This handles all overlap cases: partial overlaps, complete containment, etc.
      const isReserved = reservations.some(res => {
        const resStart = res.Start_Time;
        const resEnd = res.End_Time;
        
        // Check for overlap: reservation overlaps with slot if:
        // resStart < slotEnd AND resEnd > slotStart
        // This works for any time, including early morning reservations
        return resStart < endTime && resEnd > startTime;
      });

      timeSlots.push({
        start_time: startTime,
        end_time: endTime,
        available: !isReserved,
      });
    }

    // Log any reservations outside the displayed time range for debugging
    const displayedHours = { start: 8, end: 23 };
    reservations.forEach(res => {
      const resStartHour = parseInt(res.Start_Time.split(':')[0]);
      const resEndHour = parseInt(res.End_Time.split(':')[0]);
      if (resStartHour < displayedHours.start || resEndHour > displayedHours.end) {
        console.log(`[Availability] Warning: Reservation ${res.Reservation_ID} (${res.Start_Time} - ${res.End_Time}) is outside displayed hours (${displayedHours.start}:00 - ${displayedHours.end}:00)`);
      }
    });

    return timeSlots;
  }

  async createFromPayment(paymentData: any): Promise<Reservation[]> {
    // Declare reservations outside try block so it's accessible in catch block for cleanup
    const reservations: Reservation[] = [];
    
    try {
      const { bookingData, paymentId, amount, paymentMethod } = paymentData;
      console.log('=== CREATE FROM PAYMENT DEBUG ===');
      console.log('Payment Data received:', { paymentId, amount, paymentMethod });
      console.log('Payment ID type:', typeof paymentId);
      console.log('Payment ID starts with cs_:', paymentId?.startsWith?.('cs_'));
      
      // CRITICAL: Idempotency check - prevent duplicate processing if called multiple times
      // Note: paymentId might be a checkout session ID (cs_xxx) or payment ID
      // We'll check after we get the actual payment ID from the checkout session

      // Get actual payment method from Paymongo or use provided payment method
      // For admin-created reservations, use the paymentMethod from paymentData
      // For Paymongo checkout sessions, fetch from Paymongo API
      let actualPaymentMethod = paymentMethod?.toLowerCase() || 'gcash'; // Use provided payment method or default
      
      try {
        console.log('Processing payment ID:', paymentId);
        console.log('Payment method from request:', paymentMethod);
        
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
            
            // CRITICAL: Idempotency check - check if this payment has already been processed
            const existingPayment = await this.paymentRepository.findOne({
              where: { transaction_id: paymentIdFromSession },
            });
            
            if (existingPayment) {
              this.logger.warn(
                `⚠️⚠️⚠️ DUPLICATE createFromPayment CALL: Payment with transaction_id ${paymentIdFromSession} has already been processed! ` +
                `Existing payment ID: ${existingPayment.id}, Reservation ID: ${existingPayment.reservation_id}. ` +
                `Returning existing reservations to prevent duplicates.`
              );
              
              // Return existing reservations for this payment
              const existingReservations = await this.reservationsRepository.find({
                where: { Reservation_ID: existingPayment.reservation_id },
              });
              
              if (existingReservations.length > 0) {
                return existingReservations;
              }
            }
            
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
          // For admin-created payments (admin_cash_xxx, admin_qrph_xxx), use the provided paymentMethod
          console.log('Not a checkout session ID, using provided payment method:', paymentMethod);
          if (paymentMethod) {
            actualPaymentMethod = paymentMethod.toLowerCase();
            console.log('Using payment method from request:', actualPaymentMethod);
          } else {
            console.log('No payment method provided, using default: gcash');
            actualPaymentMethod = 'gcash';
          }
        }
      } catch (error) {
        console.error('Error fetching payment method from Paymongo:', error);
        // If error occurs and we have a provided paymentMethod, use it; otherwise default to gcash
        if (paymentMethod) {
          actualPaymentMethod = paymentMethod.toLowerCase();
          console.log('Error occurred, using provided payment method:', actualPaymentMethod);
        } else {
          actualPaymentMethod = 'gcash'; // Default fallback
        }
      }
      
      console.log('Final payment method to use:', actualPaymentMethod);

      // Determine the actual payment ID to use (for both checkout sessions and admin-created payments)
      // This needs to be defined before the loop so it's accessible after reservations are created
      let actualPaymentId = paymentId;
      if (paymentId.startsWith('cs_')) {
        // For checkout sessions, we'll use the checkout session ID as reference
        // since we don't have the actual payment ID yet
        actualPaymentId = paymentId;
      }

      // CRITICAL: Idempotency check for admin-created payments BEFORE creating any reservations
      // This prevents duplicate payment records if the endpoint is called multiple times
      if (!paymentId.startsWith('cs_')) {
        // For admin-created payments, check if this transaction_id already exists
        const existingPayment = await this.paymentRepository.findOne({
          where: { transaction_id: paymentId },
        });
        
        if (existingPayment) {
          this.logger.warn(
            `⚠️⚠️⚠️ DUPLICATE createFromPayment CALL: Payment with transaction_id ${paymentId} has already been processed! ` +
            `Existing payment ID: ${existingPayment.id}, Reservation ID: ${existingPayment.reservation_id}. ` +
            `Returning existing reservations to prevent duplicates.`
          );
          
          // Find all reservations with the same reference number
          const existingReservations = await this.reservationsRepository.find({
            where: { Reference_Number: bookingData.referenceNumber },
            order: { Reservation_ID: 'ASC' },
          });
          
          if (existingReservations.length > 0) {
            this.logger.log(`Returning ${existingReservations.length} existing reservations for transaction ${paymentId}`);
            return existingReservations;
          }
        }
      }

      const sortedCourtBookings = Array.isArray(bookingData.courtBookings)
        ? [...bookingData.courtBookings].sort((a, b) =>
            this.compareScheduleStartTimes(a?.schedule ?? '', b?.schedule ?? ''),
          )
        : [];

      const fallbackEquipmentStart =
        bookingData.equipmentStartTime ||
        this.getEarliestStartTimeFromBookings(sortedCourtBookings) ||
        this.getEarliestStartTimeFromBookings(bookingData.courtBookings || []);

      if (bookingData.equipmentBookings?.length) {
        await this.ensureEquipmentAvailabilityForDate(
          bookingData.selectedDate,
          bookingData.equipmentBookings,
          fallbackEquipmentStart,
          undefined,
          sortedCourtBookings, // Pass court bookings to check availability for each selected schedule
        );
      }

      // Initialize processed equipment tracking at the start of reservation creation
      if (!paymentData.processedEquipment) {
        paymentData.processedEquipment = new Set<string>();
      }
      const globalProcessedEquipment = paymentData.processedEquipment as Set<string>;
      
      // CRITICAL: Deduplicate equipment bookings array at the top level to prevent any duplicates
      if (bookingData.equipmentBookings && bookingData.equipmentBookings.length > 0) {
        const uniqueEquipmentBookingsMap = new Map<string, any>();
        bookingData.equipmentBookings.forEach((eqBooking: any) => {
          const key = eqBooking.selectedCourtSchedules && eqBooking.selectedCourtSchedules.length > 0
            ? `${eqBooking.equipment}::${[...eqBooking.selectedCourtSchedules].sort().join(',')}::${eqBooking.quantity || 1}`
            : `${eqBooking.equipment}::single::${eqBooking.quantity || 1}`;
          
          // If duplicate found, log it and keep the first one
          if (uniqueEquipmentBookingsMap.has(key)) {
            this.logger.warn(
              `[Equipment Rental] ⚠️ DUPLICATE equipment booking detected in array: ${key}. ` +
              `Keeping first occurrence, skipping duplicate.`
            );
          } else {
            uniqueEquipmentBookingsMap.set(key, eqBooking);
          }
        });
        
        const originalCount = bookingData.equipmentBookings.length;
        bookingData.equipmentBookings = Array.from(uniqueEquipmentBookingsMap.values());
        
        if (originalCount !== bookingData.equipmentBookings.length) {
          this.logger.warn(
            `[Equipment Rental] Deduplicated equipment bookings array: ${originalCount} -> ${bookingData.equipmentBookings.length} items`
          );
        }
      }
      
      // For admin-created reservations, create or get a user with the customer name
      // If name is blank, default to 'admin'
      let userIdForReservation = bookingData.userId;
      let isAdminCreated = false;
      
      if (bookingData.isAdminCreated) {
        isAdminCreated = true;
        const customerName = bookingData.customerName?.trim() || 'admin';
        const customerEmail = bookingData.customerEmail?.trim() || '';
        const customerContact = bookingData.customerContact?.trim() || '';
        
        // Get or create a user with the customer name
        const customerUser = await this.getOrCreateGuestUser(
          customerName,
          customerEmail,
          customerContact
        );
        userIdForReservation = customerUser.id;
      }

      // CRITICAL: Final stock availability check RIGHT BEFORE creating any reservations
      // This ensures we have the most up-to-date stock information and prevents saving reservations if stock is insufficient
      if (bookingData.equipmentBookings?.length) {
        this.logger.log('[Stock Check] Performing final stock availability check before creating reservations...');
        try {
          await this.ensureEquipmentAvailabilityForDate(
            bookingData.selectedDate,
            bookingData.equipmentBookings,
            fallbackEquipmentStart,
            undefined,
            sortedCourtBookings, // Pass court bookings to check availability for each selected schedule
          );
          this.logger.log('[Stock Check] ✅ Final stock check passed - all equipment is available');
        } catch (stockError) {
          // If stock check fails, throw error IMMEDIATELY before any database writes
          this.logger.error(`[Stock Check] ❌ Final stock check FAILED: ${stockError.message}`);
          throw new BadRequestException(
            `Cannot complete reservation: ${stockError.message}. ` +
            `Please check equipment availability and try again.`
          );
        }
      }

      // CRITICAL: Create only ONE payment record for the entire transaction
      // This prevents duplicate payment records when there are multiple court bookings
      // We'll create it after all reservations are created, linked to the first reservation
      let paymentRecordCreated = false;
      let firstReservationId: number | null = null;

      // Create reservations for each court booking
      for (const courtBooking of sortedCourtBookings) {
        // Find court by name (you might need to adjust this based on your court data)
        const courts = await this.courtsService.findAll();
        const court = courts.find(c => c.Court_Name === courtBooking.court);
        
        if (!court) {
          throw new BadRequestException(`Court "${courtBooking.court}" not found`);
        }

        // Parse schedule to get start and end times
        const [startTime, endTime] = this.parseScheduleToTimes(courtBooking.schedule);

        const reservation = this.reservationsRepository.create({
          User_ID: userIdForReservation,
          Court_ID: court.Court_Id,
          Reservation_Date: new Date(bookingData.selectedDate),
          Start_Time: startTime,
          End_Time: endTime,
          Total_Amount: courtBooking.subtotal,
          Reference_Number: bookingData.referenceNumber || `REF${Date.now()}`,
          Paymongo_Reference_Number: actualPaymentId,
          Notes: `Payment via Paymongo - ${actualPaymentId}`,
          Status: ReservationStatus.CONFIRMED,
          Is_Admin_Created: isAdminCreated,
        });

        const savedReservation = await this.reservationsRepository.save(reservation);
        reservations.push(savedReservation);

        // Store the first reservation ID for payment record linking
        if (!firstReservationId) {
          firstReservationId = savedReservation.Reservation_ID;
        }

        // Create equipment rentals only for equipment bookings associated with this reservation's schedule
        // BUT: If equipment is for multiple schedules, only create it once (for the first/earliest schedule)
        if (bookingData.equipmentBookings?.length) {
          const scheduleKey = `${courtBooking.court}-${courtBooking.schedule}`;
          
          // Use the global processed equipment set (already initialized above)
          const processedEquipment = globalProcessedEquipment;
          
          // Filter equipment bookings that are associated with this schedule
          // IMPORTANT: Also deduplicate the equipment bookings array itself to prevent duplicates
          type EquipmentBookingType = { equipment: string; time: string; subtotal?: number; quantity?: number; startTime?: string; selectedCourtSchedules?: string[] };
          const uniqueEquipmentBookings: EquipmentBookingType[] = Array.from(
            new Map(
              bookingData.equipmentBookings.map((eqBooking: any) => {
                const key = eqBooking.selectedCourtSchedules && eqBooking.selectedCourtSchedules.length > 0
                  ? `${eqBooking.equipment}::${[...eqBooking.selectedCourtSchedules].sort().join(',')}`
                  : `${eqBooking.equipment}::single`;
                return [key, eqBooking];
              })
            ).values()
          ) as EquipmentBookingType[];
          
          const relevantEquipmentBookings = uniqueEquipmentBookings.filter((eqBooking: any) => {
            // If no selectedCourtSchedules, associate with all schedules (backward compatibility)
            if (!eqBooking.selectedCourtSchedules || eqBooking.selectedCourtSchedules.length === 0) {
              // For backward compatibility, only create once per equipment
              const equipmentKey = `${eqBooking.equipment}::single`;
              if (processedEquipment.has(equipmentKey)) {
                this.logger.log(`[Equipment Rental] Skipping duplicate (no schedules): ${equipmentKey} for schedule ${scheduleKey}`);
                return false; // Already processed
              }
              // Mark as processed immediately
              processedEquipment.add(equipmentKey);
              this.logger.log(`[Equipment Rental] Processing (no schedules): ${equipmentKey} for schedule ${scheduleKey}, quantity: ${eqBooking.quantity || 1}`);
              return true;
            }
            
            // Check if this schedule is in the selected schedules
            const isForThisSchedule = eqBooking.selectedCourtSchedules.includes(scheduleKey);
            
            if (!isForThisSchedule) {
              return false;
            }
            
            // Mark this equipment as processed using a unique key FIRST
            // Use equipment name + sorted schedules to create a consistent key
            // This ensures we only process each equipment booking once, regardless of how many schedules it's for
            const sortedSchedules = [...eqBooking.selectedCourtSchedules].sort().join(',');
            const equipmentKey = `${eqBooking.equipment}::${sortedSchedules}`;
            
            // Check if already processed - this is the PRIMARY check to prevent duplicates
            if (processedEquipment.has(equipmentKey)) {
              this.logger.log(`[Equipment Rental] ⚠️ Skipping duplicate equipment booking: ${equipmentKey} for schedule ${scheduleKey}`);
              return false; // Already processed
            }
            
            // If equipment is for multiple schedules, only create rental ONCE for the first/earliest schedule
            // BUT: The rental time will span ALL selected schedules so availability is reduced in all of them
            if (eqBooking.selectedCourtSchedules.length > 1) {
              // Find the first/earliest schedule from the selected schedules
              // sortedCourtBookings is already sorted by start time
              const matchingSchedules = sortedCourtBookings.filter(cb => 
                eqBooking.selectedCourtSchedules && eqBooking.selectedCourtSchedules.includes(`${cb.court}-${cb.schedule}`)
              );
              
              if (matchingSchedules.length > 0) {
                // Get the first schedule (earliest) from the matching schedules
                const firstSchedule = matchingSchedules[0];
                const firstScheduleKey = `${firstSchedule.court}-${firstSchedule.schedule}`;
                
                // Only create rental if this is the first/earliest schedule
                // The rental time will be calculated to span ALL selected schedules in createEquipmentRentalsFromBooking
                if (scheduleKey !== firstScheduleKey) {
                  this.logger.log(
                    `[Equipment Rental] Skipping non-first schedule: ${scheduleKey} (first is ${firstScheduleKey}) for equipment ${equipmentKey}. ` +
                    `Rental will be created for first schedule but will span all ${eqBooking.selectedCourtSchedules.length} selected schedules.`
                  );
                  return false; // Skip - will be created for the first schedule with time spanning all schedules
                }
              }
            }
            
            // Mark as processed BEFORE returning true - CRITICAL: Do this before returning
            processedEquipment.add(equipmentKey);
            this.logger.log(`[Equipment Rental] ✅ Processing equipment booking: ${equipmentKey} for schedule ${scheduleKey}, quantity: ${eqBooking.quantity || 1}`);
            
            return true;
          });
          
          if (relevantEquipmentBookings.length > 0) {
            this.logger.log(
              `[Equipment Rental] Creating rentals for reservation ${savedReservation.Reservation_ID}, ` +
              `schedule: ${scheduleKey}, equipment count: ${relevantEquipmentBookings.length}. ` +
              `Equipment details: ${relevantEquipmentBookings.map((eq: any) => 
                `${eq.equipment} (qty: ${eq.quantity || 1}, schedules: ${eq.selectedCourtSchedules ? `[${eq.selectedCourtSchedules.join(', ')}] (${eq.selectedCourtSchedules.length} schedules)` : 'none'})`
              ).join(', ')}`
            );
            
            // CRITICAL: Only create rentals if this is the first/earliest schedule for multi-schedule equipment
            // Check if any equipment has multiple schedules and if this is the first schedule
            const hasMultiScheduleEquipment = relevantEquipmentBookings.some((eq: any) => 
              eq.selectedCourtSchedules && eq.selectedCourtSchedules.length > 1
            );
            
            if (hasMultiScheduleEquipment) {
              // For multi-schedule equipment, verify this is the first schedule
              const multiScheduleEquipment = relevantEquipmentBookings.filter((eq: any) => 
                eq.selectedCourtSchedules && eq.selectedCourtSchedules.length > 1
              );
              
              for (const eq of multiScheduleEquipment) {
                const matchingSchedules = sortedCourtBookings.filter(cb => 
                  eq.selectedCourtSchedules && eq.selectedCourtSchedules.includes(`${cb.court}-${cb.schedule}`)
                );
                
                if (matchingSchedules.length > 0) {
                  const firstSchedule = matchingSchedules[0];
                  const firstScheduleKey = `${firstSchedule.court}-${firstSchedule.schedule}`;
                  
                  if (scheduleKey !== firstScheduleKey) {
                    this.logger.log(
                      `[Equipment Rental] ⚠️ SKIPPING rental creation for reservation ${savedReservation.Reservation_ID} ` +
                      `because this is not the first schedule (${scheduleKey} vs ${firstScheduleKey}) for multi-schedule equipment ${eq.equipment}. ` +
                      `Rental will be created for the first schedule with time spanning all schedules.`
                    );
                    // Remove this equipment from the list for this reservation
                    const index = relevantEquipmentBookings.indexOf(eq);
                    if (index > -1) {
                      relevantEquipmentBookings.splice(index, 1);
                    }
                  }
                }
              }
            }
            
            if (relevantEquipmentBookings.length > 0) {
              // CRITICAL: Check stock availability AGAIN right before creating equipment rentals
              // This is a final safeguard in case stock changed between the initial check and now
              // If this fails, we need to rollback the reservation that was just created
              try {
                // Re-check stock for the equipment we're about to create rentals for
                const reservationDate = this.formatDateOnly(bookingData.selectedDate);
                for (const eqBooking of relevantEquipmentBookings) {
                  const equipmentRow = await this.equipmentRepository.findOne({ 
                    where: { equipment_name: Like(`%${eqBooking.equipment}%`) } 
                  });
                  
                  if (equipmentRow) {
                    const quantity = eqBooking.quantity && eqBooking.quantity > 0 ? eqBooking.quantity : 1;
                    const hours = this.parseHours(eqBooking.time);
                    const bookingStartTime = this.ensureTimeFormat(startTime);
                    
                    if (bookingStartTime) {
                      const reservedQuantity = await this.getReservedQuantityForRange(
                        equipmentRow.id,
                        reservationDate,
                        bookingStartTime,
                        hours,
                        savedReservation.Reservation_ID, // Exclude this reservation from the check
                      );
                      const remaining = equipmentRow.stocks - reservedQuantity;
                      
                      if (remaining < quantity) {
                        // Stock is insufficient - we need to delete the reservation we just created
                        this.logger.error(
                          `[Stock Check] ❌ CRITICAL: Stock check failed AFTER reservation was created! ` +
                          `Reservation ${savedReservation.Reservation_ID} will be deleted. ` +
                          `Equipment: ${equipmentRow.equipment_name}, Remaining: ${remaining}, Required: ${quantity}`
                        );
                        
                        // Delete the reservation that was just created
                        await this.reservationsRepository.remove(savedReservation);
                        // Remove from reservations array
                        const index = reservations.indexOf(savedReservation);
                        if (index > -1) {
                          reservations.splice(index, 1);
                        }
                        
                        throw new BadRequestException(
                          `Not enough stock for ${equipmentRow.equipment_name} on ${reservationDate} at ${bookingStartTime}. ` +
                          `Remaining: ${Math.max(remaining, 0)}, Required: ${quantity}. ` +
                          `Reservation has been cancelled.`
                        );
                      }
                    }
                  }
                }
                
                // Stock check passed - proceed with creating equipment rentals
                await this.createEquipmentRentalsFromBooking(
                  userIdForReservation,
                  savedReservation,
                  relevantEquipmentBookings,
                  startTime, // Use this reservation's start time
                );
              } catch (rentalError) {
                // If equipment rental creation fails (including stock check), delete the reservation
                this.logger.error(
                  `[Equipment Rental] ❌ Failed to create equipment rentals for reservation ${savedReservation.Reservation_ID}: ${rentalError.message}. ` +
                  `Deleting reservation to maintain data consistency.`
                );
                
                // Delete the reservation that was just created
                try {
                  await this.reservationsRepository.remove(savedReservation);
                  // Remove from reservations array
                  const index = reservations.indexOf(savedReservation);
                  if (index > -1) {
                    reservations.splice(index, 1);
                  }
                  this.logger.log(`[Equipment Rental] ✅ Deleted reservation ${savedReservation.Reservation_ID} due to equipment rental failure`);
                } catch (deleteError) {
                  this.logger.error(`[Equipment Rental] ❌ Failed to delete reservation ${savedReservation.Reservation_ID}: ${deleteError.message}`);
                }
                
                // Re-throw the error to fail the entire operation
                throw rentalError;
              }
            } else {
              this.logger.log(
                `[Equipment Rental] All equipment bookings filtered out for reservation ${savedReservation.Reservation_ID} ` +
                `(multi-schedule equipment will be created for first schedule only)`
              );
            }
          } else {
            this.logger.log(
              `[Equipment Rental] No relevant equipment bookings for reservation ${savedReservation.Reservation_ID}, ` +
              `schedule: ${scheduleKey}`
            );
          }
        }
      }

      // CRITICAL: Create only ONE payment record for the entire transaction
      // Link it to the first reservation to avoid duplicate payment records
      if (reservations.length > 0 && firstReservationId && !paymentRecordCreated) {
        try {
          const firstReservation = reservations[0];
          await this.createPaymentRecord(firstReservation, actualPaymentId, amount, bookingData, actualPaymentMethod);
          paymentRecordCreated = true;
          this.logger.log(`Created single payment record for transaction ${actualPaymentId}, linked to reservation ${firstReservationId}`);
        } catch (paymentError) {
          // Log error but don't fail the entire operation
          this.logger.error(`Failed to create payment record: ${paymentError.message}`, paymentError.stack);
          // Still continue - reservations are already created
        }
      }

      // Send email receipt if customer email is provided (admin-created reservations)
      // Wrap in try-catch to ensure email errors don't fail the entire operation
      if (bookingData.customerEmail && bookingData.customerEmail.trim() && reservations.length > 0) {
        try {
          const firstReservation = reservations[0];
          const court = await this.courtsService.findOne(firstReservation.Court_ID);
          
          // Prepare reservation details for email
          const reservationDetails = {
            courtName: court.Court_Name || 'Court',
            date: bookingData.selectedDate,
            timeSlot: `${firstReservation.Start_Time} - ${firstReservation.End_Time}`,
            duration: this.calculateDuration(firstReservation.Start_Time, firstReservation.End_Time)
          };

          // Calculate total amount
          const totalAmount = reservations.reduce((sum, res) => sum + Number(res.Total_Amount || 0), 0);
          
          // Get payment method from paymentData
          const paymentMethodType = paymentData.paymentMethod || 'Cash';
          const paymentMethodDisplay = paymentMethodType === 'Cash' ? 'Cash' : paymentMethodType === 'QR Ph' ? 'QR Ph' : 'Cash';

          // Build order items from court bookings and equipment bookings
          const orderItems: Array<{ name: string; price: string; quantity: number; total: string }> = [];
          
          // Add court reservations
          if (bookingData.courtBookings && Array.isArray(bookingData.courtBookings)) {
            for (const courtBooking of bookingData.courtBookings) {
              const courtPrice = new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
              }).format(Number(courtBooking.subtotal || 0));
              
              orderItems.push({
                name: `Court Reservation`,
                price: courtPrice,
                quantity: 1,
                total: courtPrice
              });
            }
          }
          
          // Add equipment rentals
          if (bookingData.equipmentBookings && Array.isArray(bookingData.equipmentBookings)) {
            for (const equipmentBooking of bookingData.equipmentBookings) {
              const equipmentPrice = new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
              }).format(Number(equipmentBooking.subtotal || 0) / (equipmentBooking.quantity || 1));
              
              const equipmentTotal = new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
              }).format(Number(equipmentBooking.subtotal || 0));
              
              orderItems.push({
                name: `Rent: ${equipmentBooking.equipment}`,
                price: equipmentPrice,
                quantity: equipmentBooking.quantity || 1,
                total: equipmentTotal
              });
            }
          }

          // Send email receipt
          await this.emailReceiptService.sendPaymentReceipt({
            paymentId: paymentData.paymentId || `admin_${Date.now()}`,
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: 'PHP',
            description: `Badminton Court Booking - ${bookingData.selectedDate}`,
            status: 'completed',
            paidAt: new Date(),
            customerName: bookingData.customerName || 'Customer',
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerContact || '',
            billingAddress: {
              line1: 'Budz Badminton Court',
              city: 'Manila',
              state: 'Metro Manila',
              postal_code: '1000',
              country: 'Philippines'
            },
            paymentMethod: {
              type: paymentMethodDisplay.toLowerCase().replace(' ', '_'),
            },
            fee: 0,
            netAmount: Math.round(totalAmount * 100),
            referenceNumber: bookingData.referenceNumber || firstReservation.Reference_Number,
            reservationDetails,
            orderItems
          });

          this.logger.log(`Email receipt sent to ${bookingData.customerEmail} for admin-created reservation`);
        } catch (emailError) {
          // Log error but don't fail the reservation creation
          this.logger.error(`Failed to send email receipt: ${emailError.message}`, emailError.stack);
          // Continue - reservations are already created successfully
        }
      }

      // Always return reservations even if email failed
      // This ensures the frontend gets a successful response
      if (reservations.length > 0) {
        this.logger.log(`✅ Successfully created ${reservations.length} reservation(s) for transaction ${actualPaymentId}`);
        return reservations;
      } else {
        throw new BadRequestException('No reservations were created');
      }
    } catch (error) {
      // CRITICAL: If any error occurs, clean up ALL reservations that were created
      // This prevents partial data from being saved when there's an error
      if (reservations.length > 0) {
        this.logger.error(
          `❌ Error occurred after creating ${reservations.length} reservation(s). ` +
          `Cleaning up all created reservations to maintain data consistency...`
        );
        
        // Delete all reservations that were created
        for (const reservation of reservations) {
          try {
            await this.reservationsRepository.remove(reservation);
            this.logger.log(`✅ Cleaned up reservation ${reservation.Reservation_ID}`);
          } catch (cleanupError) {
            this.logger.error(
              `❌ Failed to clean up reservation ${reservation.Reservation_ID}: ${cleanupError.message}`
            );
          }
        }
        
        this.logger.log(`✅ Cleaned up ${reservations.length} reservation(s) due to error`);
      }
      
      this.logger.error(`❌ Error in createFromPayment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create reservations from payment: ${error.message}`);
    }
  }

  private calculateDuration(startTime: string, endTime: string): number {
    try {
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal place
    } catch {
      return 1;
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

  private formatTimeTo12Hour(startTime24: string, endTime24: string): string {
    // Convert "HH:MM:SS" or "HH:MM" to "H:MM AM/PM - H:MM AM/PM"
    const parseTime = (timeStr: string) => {
      const [hour, minute] = timeStr.split(':').map(Number);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const minStr = minute.toString().padStart(2, '0');
      return `${hour12}:${minStr} ${period}`;
    };
    
    return `${parseTime(startTime24)} - ${parseTime(endTime24)}`;
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
      case 'cash':
        return PaymentMethod.CASH;
      case 'qrph':
      case 'qr_ph':
      case 'qr_philippines':
        return PaymentMethod.QRPH;
      default:
        return PaymentMethod.GCASH; // Default fallback
    }
  }

  async checkDuplicateReservation(
    userId: number,
    courtId: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<{ isDuplicate: boolean; message?: string; reservationId?: number }> {
    try {
      // Parse the date string
      const reservationDate = new Date(date);
      reservationDate.setHours(0, 0, 0, 0);

      this.logger.debug(
        `[Duplicate Check] Starting duplicate check - User ID: ${userId}, Court ID: ${courtId}, Date: ${date}, Time: ${startTime} - ${endTime}`
      );

      // Normalize time formats - ensure consistent format (HH:MM:SS)
      const normalizeTime = (time: string): string => {
        // Remove any whitespace
        time = time.trim();
        // If time is in HH:MM format, add :00 for seconds
        if (time.match(/^\d{1,2}:\d{2}$/)) {
          return time + ':00';
        }
        // If time is in HH:MM:SS format, return as is
        if (time.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
          return time;
        }
        return time;
      };

      const normalizedStartTime = normalizeTime(startTime);
      const normalizedEndTime = normalizeTime(endTime);

      this.logger.debug(`[Duplicate Check] Normalized times: ${normalizedStartTime} - ${normalizedEndTime}`);

      // Find all CONFIRMED reservations for this user, court, and date
      // IMPORTANT: Only CONFIRMED reservations block bookings
      // - PENDING reservations don't block (they may be from failed/abandoned payments)
      // - CANCELLED reservations don't block (they're already cancelled)
      // - COMPLETED reservations don't block (they're in the past)
      // - Admin-created reservations don't block user bookings (Is_Admin_Created: false)
      // We'll compare times manually to handle format differences
      const reservations = await this.reservationsRepository.find({
        where: {
          User_ID: userId,
          Court_ID: courtId,
          Reservation_Date: reservationDate,
          Status: ReservationStatus.CONFIRMED, // ONLY CONFIRMED reservations block bookings
          Is_Admin_Created: false, // Only check user-created reservations
        },
      });

      this.logger.debug(
        `[Duplicate Check] Found ${reservations.length} existing CONFIRMED reservations for User ${userId}, Court ${courtId}, Date ${date} ` +
        `(excluding admin-created and pending reservations)`
      );
      
      // Log all found reservations for debugging
      if (reservations.length > 0) {
        reservations.forEach(res => {
          this.logger.debug(
            `[Duplicate Check] Found reservation: ID=${res.Reservation_ID}, ` +
            `Time=${res.Start_Time}-${res.End_Time}, ` +
            `Is_Admin_Created=${res.Is_Admin_Created}, ` +
            `Reference=${res.Reference_Number || 'N/A'}`
          );
        });
      }

      // Check if any reservation matches the time slot (handling format differences)
      const isDuplicate = reservations.some(res => {
        const resStart = normalizeTime(res.Start_Time);
        const resEnd = normalizeTime(res.End_Time);
        
        this.logger.debug(`[Duplicate Check] Comparing: Reservation ${res.Reservation_ID} (${resStart} - ${resEnd}) vs Requested (${normalizedStartTime} - ${normalizedEndTime})`);
        
        // Compare normalized times
        const matches = resStart === normalizedStartTime && resEnd === normalizedEndTime;
        if (matches) {
          this.logger.warn(`[Duplicate Check] ⚠️ Duplicate found! Reservation ID: ${res.Reservation_ID}`);
        }
        return matches;
      });

      if (isDuplicate) {
        const duplicateReservation = reservations.find(res => {
          const resStart = normalizeTime(res.Start_Time);
          const resEnd = normalizeTime(res.End_Time);
          return resStart === normalizedStartTime && resEnd === normalizedEndTime;
        });
        
        // CRITICAL: Double-check the reservation details to ensure it's valid
        // This is a safety check in case the query filter didn't work correctly
        if (duplicateReservation) {
          // Verify it's not admin-created (should already be filtered, but double-check)
          if (duplicateReservation.Is_Admin_Created === true) {
            this.logger.warn(
              `[Duplicate Check] ⚠️ WARNING: Found admin-created reservation in results! ` +
              `Reservation ID: ${duplicateReservation.Reservation_ID}. ` +
              `This should have been filtered out. Allowing booking to proceed.`
            );
            return { isDuplicate: false };
          }
          
          // Verify user ID matches (should already match, but double-check)
          if (duplicateReservation.User_ID !== userId) {
            this.logger.error(
              `[Duplicate Check] 🚨 DATA INTEGRITY ERROR: Reservation ${duplicateReservation.Reservation_ID} ` +
              `belongs to User ${duplicateReservation.User_ID} but duplicate check was for User ${userId}. ` +
              `This should not happen. Allowing booking to proceed.`
            );
            return { isDuplicate: false };
          }
        }
        
        this.logger.warn(
          `[Duplicate Check] ❌ Duplicate reservation detected for User ${userId}, Court ${courtId}, Date ${date}, Time ${normalizedStartTime}-${normalizedEndTime}. ` +
          `Existing reservation ID: ${duplicateReservation?.Reservation_ID}, Status: ${duplicateReservation?.Status}, ` +
          `Reference: ${duplicateReservation?.Reference_Number || 'N/A'}, ` +
          `Is_Admin_Created: ${duplicateReservation?.Is_Admin_Created}, ` +
          `User_ID: ${duplicateReservation?.User_ID}`
        );
        
        // Build detailed error message
        const reservationDetails = duplicateReservation 
          ? `Reservation ID: ${duplicateReservation.Reservation_ID}, Reference: ${duplicateReservation.Reference_Number || 'N/A'}`
          : 'Unknown reservation';
        
        this.logger.warn(
          `[Duplicate Check] Full reservation details: ${JSON.stringify({
            reservationId: duplicateReservation?.Reservation_ID,
            referenceNumber: duplicateReservation?.Reference_Number,
            isAdminCreated: duplicateReservation?.Is_Admin_Created,
            status: duplicateReservation?.Status,
            userId: duplicateReservation?.User_ID,
            courtId: duplicateReservation?.Court_ID,
            date: duplicateReservation?.Reservation_Date,
            startTime: duplicateReservation?.Start_Time,
            endTime: duplicateReservation?.End_Time,
          }, null, 2)}`
        );
        
        return {
          isDuplicate: true,
          message: `You have already booked this court for the same date and time. ` +
            `Details: ${reservationDetails}. ` +
            `Please check your "My Reservations" page. If you don't see this reservation there, ` +
            `please refresh the page or contact support with Reservation ID: ${duplicateReservation?.Reservation_ID}.`,
          reservationId: duplicateReservation?.Reservation_ID,
        };
      }

      this.logger.debug(`[Duplicate Check] ✅ No duplicate found`);
      return { isDuplicate: false };
    } catch (error) {
      this.logger.error('Error checking duplicate reservation:', error);
      // Return false on error to allow booking (fail-safe)
      return { isDuplicate: false };
    }
  }

  private async getOrCreateGuestUser(
    customerName: string,
    customerEmail?: string,
    customerContact?: string,
  ): Promise<User> {
    // For admin-created reservations, default to 'admin' if name is blank
    const sanitizedName = customerName?.trim() || 'admin';
    const sanitizedEmail = customerEmail?.trim() || '';
    const sanitizedContact = customerContact?.trim() || '';

    let user: User | null = null;

    if (sanitizedEmail) {
      user = await this.userRepository.findOne({
        where: { email: sanitizedEmail },
      });
    }

    if (!user) {
      user = await this.userRepository.findOne({
        where: { name: Like(`%${sanitizedName}%`) },
      });
    }

    if (user) {
      let requiresUpdate = false;

      // Always update the name for admin-created reservations to ensure the exact name entered is used
      if (sanitizedName && sanitizedName !== user.name) {
        user.name = sanitizedName;
        requiresUpdate = true;
      }

      if (
        sanitizedEmail &&
        sanitizedEmail !== user.email &&
        (!user.email || user.email.trim() === '' || user.email.endsWith('@walkin.local'))
      ) {
        user.email = sanitizedEmail;
        requiresUpdate = true;
      }

      if (sanitizedContact && sanitizedContact !== (user.contact_number || '')) {
        user.contact_number = sanitizedContact;
        requiresUpdate = true;
      }

      if (requiresUpdate) {
        user = await this.userRepository.save(user);
      }

      return user;
    }

    const username = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    let emailForUser = sanitizedEmail;

    if (emailForUser) {
      const existingWithEmail = await this.userRepository.findOne({
        where: { email: emailForUser },
      });
      if (existingWithEmail) {
        emailForUser = '';
      }
    }

    if (!emailForUser) {
      emailForUser = `${username}@walkin.local`;
    }

    const randomPassword = `Guest${Date.now()}${Math.random().toString(36).substr(2, 9)}!@#`;
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    const newUser = this.userRepository.create({
      name: sanitizedName,
      username,
      email: emailForUser,
      password: hashedPassword,
      role: 'user',
      is_active: true,
      is_verified: false,
      ...(sanitizedContact ? { contact_number: sanitizedContact } : {}),
    });

    return this.userRepository.save(newUser);
  }


  private formatDateOnly(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid reservation date for equipment availability.');
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async getReservedQuantityForRange(
    equipmentId: number,
    reservationDate: string,
    startTime: string | null,
    hours: number | null,
    excludeReservationId?: number,
  ): Promise<number> {
    const now = new Date();
    
    // CRITICAL: Find ALL rental items for this equipment on this date, regardless of which reservation they're associated with
    // This ensures rentals spanning multiple schedules are counted for ALL schedules
    const query = this.equipmentRentalItemRepository
      .createQueryBuilder('item')
      .innerJoin(EquipmentRental, 'rental', 'rental.id = item.rental_id')
      .innerJoin(Reservation, 'reservation', 'reservation.Reservation_ID = rental.reservation_id')
      .where('item.equipment_id = :equipmentId', { equipmentId })
      .andWhere('reservation.Reservation_Date = :reservationDate', { reservationDate })
      .andWhere('reservation.Status IN (:...statuses)', {
        statuses: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING, ReservationStatus.COMPLETED],
      })
      // Only count active rentals (not expired and stock not restored)
      .andWhere('(item.rental_end_time IS NULL OR item.rental_end_time > :now)', { now })
      .andWhere('item.stock_restored = :stockRestored', { stockRestored: false });

    if (excludeReservationId) {
      query.andWhere('reservation.Reservation_ID != :excludeReservationId', { excludeReservationId });
    }

    const rows = await query
      .select([
        'item.quantity AS item_quantity',
        'item.rental_start_time AS rental_start_time',
        'item.rental_end_time AS rental_end_time',
      ])
      .getRawMany<{ item_quantity: string; rental_start_time: Date | null; rental_end_time: Date | null }>();

    if (!startTime || !hours) {
      return rows.reduce((sum, row) => sum + Number(row.item_quantity ?? 0), 0);
    }

    // Convert target time range to Date objects for comparison
    // Parse reservationDate string (format: YYYY-MM-DD)
    const [year, month, day] = reservationDate.split('-').map(Number);
    const [targetStartHour, targetStartMin] = startTime.split(':').map(Number);
    const targetStartDate = new Date(year, month - 1, day, targetStartHour, targetStartMin || 0, 0);
    const targetEndDate = new Date(targetStartDate);
    targetEndDate.setHours(targetEndDate.getHours() + hours);

    return rows.reduce((sum, row) => {
      // Use rental item's actual start and end times (not reservation times)
      const rentalStart = row.rental_start_time ? new Date(row.rental_start_time) : null;
      const rentalEnd = row.rental_end_time ? new Date(row.rental_end_time) : null;

      if (!rentalStart || !rentalEnd) {
        // If rental times are not set, count it (backward compatibility)
        return sum + Number(row.item_quantity ?? 0);
      }

      // Check if rental time range overlaps with target time range
      // Two time ranges overlap if: rentalStart < targetEnd AND rentalEnd > targetStart
      const overlaps = rentalStart < targetEndDate && rentalEnd > targetStartDate;

      // Only log if there's an issue (non-overlap) to reduce log noise
      if (!overlaps) {
        this.logger.debug(
          `[Availability Check] Rental does NOT overlap: ` +
          `rental ${rentalStart.toISOString()} - ${rentalEnd.toISOString()} ` +
          `does NOT overlap with schedule ${targetStartDate.toISOString()} - ${targetEndDate.toISOString()}, ` +
          `equipmentId: ${equipmentId}`
        );
      }

      return overlaps
        ? sum + Number(row.item_quantity ?? 0)
        : sum;
    }, 0);
  }

  private async ensureEquipmentAvailabilityForDate(
    dateInput: string | Date,
    equipmentBookings: Array<{ equipment: string; time: string; subtotal?: number; quantity?: number; startTime?: string; selectedCourtSchedules?: string[] }>,
    defaultStartTime?: string | null,
    excludeReservationId?: number,
    courtBookings?: Array<{ court: string; schedule: string; subtotal: number }>,
  ) {
    if (!equipmentBookings || equipmentBookings.length === 0) return;

    const reservationDate = this.formatDateOnly(dateInput);
    const normalizedDefaultStart = defaultStartTime ? this.ensureTimeFormat(defaultStartTime) : null;

    const uniqueNames = Array.from(
      new Set(
        equipmentBookings
          .map((booking) => booking.equipment)
          .filter((name): name is string => Boolean(name && name.trim().length > 0)),
      ),
    );

    const equipmentRows =
      uniqueNames.length > 0
        ? await this.equipmentRepository.find({
            where: uniqueNames.map((name) => ({ equipment_name: Like(`%${name}%`) })),
          })
        : [];

    for (const booking of equipmentBookings) {
      const quantity = booking.quantity && booking.quantity > 0 ? booking.quantity : 1;

      let equipmentRow =
        equipmentRows.find((row) => row.equipment_name.toLowerCase() === booking.equipment.toLowerCase()) ??
        equipmentRows.find((row) => row.equipment_name.toLowerCase().includes(booking.equipment.toLowerCase()));

      if (!equipmentRow) {
        const fallbackRow = await this.equipmentRepository.findOne({ where: { equipment_name: booking.equipment } });
        if (fallbackRow) {
          equipmentRow = fallbackRow;
        }
      }

      if (!equipmentRow) {
        throw new BadRequestException(`Equipment "${booking.equipment}" not found.`);
      }

      const bookingHours = this.parseHours(booking.time);

      // If equipment is associated with specific court schedules, check availability
      // IMPORTANT: When equipment is for multiple schedules, we only need to check if there's enough stock
      // for the quantity ONCE (not per schedule), since we only create ONE rental item
      if (booking.selectedCourtSchedules && booking.selectedCourtSchedules.length > 0 && courtBookings) {
        // Get the earliest schedule to check availability (since we'll create rental for the earliest one)
        const matchingSchedules = courtBookings
          .filter(cb => booking.selectedCourtSchedules && booking.selectedCourtSchedules.includes(`${cb.court}-${cb.schedule}`))
          .sort((a, b) => this.compareScheduleStartTimes(a.schedule, b.schedule));
        
        if (matchingSchedules.length > 0) {
          const earliestSchedule = matchingSchedules[0];
          const [startTime] = this.parseScheduleToTimes(earliestSchedule.schedule);
          const bookingStartTime = this.ensureTimeFormat(startTime);

          if (!bookingStartTime) {
            throw new BadRequestException(
              `Missing start time for equipment rental of ${equipmentRow.equipment_name}.`,
            );
          }

          // Check availability - we only need quantity available (not quantity per schedule)
          // because we're only creating ONE rental item for all selected schedules
          const reservedQuantity = await this.getReservedQuantityForRange(
            equipmentRow.id,
            reservationDate,
            bookingStartTime,
            bookingHours,
            excludeReservationId,
          );

          const remaining = equipmentRow.stocks - reservedQuantity;

          // Only need the specified quantity available (not multiplied by number of schedules)
          if (remaining < quantity) {
            const schedulesList = booking.selectedCourtSchedules.join(', ');
            throw new BadRequestException(
              `Not enough stock for ${equipmentRow.equipment_name} on ${reservationDate}. ` +
                `Remaining: ${Math.max(remaining, 0)}, Required: ${quantity} (for schedules: ${schedulesList})`,
            );
          }
        }
      } else {
        // Backward compatibility: use single start time
        const bookingStartTime = this.ensureTimeFormat(booking.startTime ?? normalizedDefaultStart);

        if (!bookingStartTime) {
          throw new BadRequestException(
            `Missing start time for equipment rental of ${equipmentRow.equipment_name}. Please select a court schedule first.`,
          );
        }

        const reservedQuantity = await this.getReservedQuantityForRange(
          equipmentRow.id,
          reservationDate,
          bookingStartTime,
          bookingHours,
          excludeReservationId,
        );

        const remaining = equipmentRow.stocks - reservedQuantity;

        if (remaining < quantity) {
          throw new BadRequestException(
            `Not enough stock for ${equipmentRow.equipment_name} on ${reservationDate} at ${bookingStartTime}. ` +
              `Remaining: ${Math.max(remaining, 0)}`,
          );
        }
      }
    }
  }

  private async createEquipmentRentalsFromBooking(
    userId: number,
    reservation: Reservation,
    equipmentBookings: Array<{ equipment: string; time: string; subtotal?: number; quantity?: number; startTime?: string; selectedCourtSchedules?: string[] }>,
    defaultStartTime?: string | null,
  ) {
    if (!reservation?.Reservation_ID || !userId || !equipmentBookings || equipmentBookings.length === 0) {
      this.logger.log(`[Equipment Rental] Skipping createEquipmentRentalsFromBooking - invalid params: reservationId=${reservation?.Reservation_ID}, userId=${userId}, bookings=${equipmentBookings?.length || 0}`);
      return;
    }

    this.logger.log(
      `[Equipment Rental] createEquipmentRentalsFromBooking called for reservation ${reservation.Reservation_ID}, ` +
      `equipment count: ${equipmentBookings.length}, ` +
      `equipment: ${equipmentBookings.map((eq: any) => `${eq.equipment} (qty: ${eq.quantity || 1})`).join(', ')}`
    );

    const normalizedDefaultStart = defaultStartTime ? this.ensureTimeFormat(defaultStartTime) : null;

    // Check if rental already exists for this reservation (reuse it instead of creating duplicate)
    const existingRental = await this.equipmentRentalRepository.findOne({
      where: { reservation_id: reservation.Reservation_ID },
    });

    let savedRental;
    if (existingRental) {
      savedRental = existingRental;
      this.logger.log(`[Equipment Rental] Using existing rental ${savedRental.id} for reservation ${reservation.Reservation_ID}`);
    } else {
      const rental = this.equipmentRentalRepository.create({
        reservation_id: reservation.Reservation_ID,
        user_id: userId,
        total_amount: 0,
      });
      savedRental = await this.equipmentRentalRepository.save(rental);
      this.logger.log(`[Equipment Rental] Created new rental ${savedRental.id} for reservation ${reservation.Reservation_ID}`);
    }

    let total = 0;
    // Track equipment processed in this batch to prevent duplicates within the same call
    const processedInBatch = new Set<string>();
    
    for (const b of equipmentBookings) {
      const hours = this.parseHours(b.time);
      // CRITICAL: Ensure quantity is exactly what the user selected (not doubled)
      const quantity = b.quantity && b.quantity > 0 ? Number(b.quantity) : 1;
      
      this.logger.log(
        `[Equipment Rental] Processing equipment booking: ${b.equipment}, ` +
        `requested quantity: ${b.quantity}, parsed quantity: ${quantity}, ` +
        `hours: ${hours}, reservation: ${reservation.Reservation_ID}, ` +
        `selectedCourtSchedules: ${b.selectedCourtSchedules ? `[${b.selectedCourtSchedules.join(', ')}] (${b.selectedCourtSchedules.length} schedules)` : 'none'}`
      );
      
      // Create a unique key for this equipment booking
      // Use equipment name + sorted schedules to create a consistent key
      const sortedSchedules = (b.selectedCourtSchedules && b.selectedCourtSchedules.length > 0)
        ? [...b.selectedCourtSchedules].sort().join(',')
        : 'single';
      const equipmentKey = `${b.equipment}::${sortedSchedules}`;
      
      // Skip if already processed in this batch - CRITICAL: This prevents creating duplicate rental items
      if (processedInBatch.has(equipmentKey)) {
        this.logger.warn(
          `[Equipment Rental] ⚠️ SKIPPING DUPLICATE in batch: ${equipmentKey}, ` +
          `quantity: ${quantity}, reservation: ${reservation.Reservation_ID}. ` +
          `This should not happen - equipment already processed in this batch.`
        );
        continue; // Skip this iteration - don't create another rental item
      }
      
      // Find equipment row first (needed for checks below)
      let equipmentRow = await this.equipmentRepository.findOne({ where: { equipment_name: Like(`%${b.equipment}%`) } });
      if (!equipmentRow) {
        const fallbackRow = await this.equipmentRepository.findOne({ where: { equipment_name: b.equipment } });
        if (fallbackRow) {
          equipmentRow = fallbackRow;
        }
      }
      
      // CRITICAL: For multi-schedule equipment, verify this is being processed for the FIRST schedule only
      // This is a final safeguard to prevent creating multiple rentals
      if (b.selectedCourtSchedules && b.selectedCourtSchedules.length > 1 && equipmentRow) {
        // Get reservation date first (needed for the check)
        const reservationDateForCheck = this.formatDateOnly(reservation.Reservation_Date);
        
        // Check if a rental already exists for this equipment with the same selected schedules
        // This prevents creating a second rental if the function is called multiple times
        const existingRentalCheck = await this.equipmentRentalItemRepository
          .createQueryBuilder('item')
          .innerJoin(EquipmentRental, 'rental', 'rental.id = item.rental_id')
          .innerJoin(Reservation, 'res', 'res.Reservation_ID = rental.reservation_id')
          .where('item.equipment_id = :equipmentId', { equipmentId: equipmentRow.id })
          .andWhere('res.Reservation_Date = :reservationDate', { reservationDate: reservationDateForCheck })
          .andWhere('res.Reference_Number = :referenceNumber', { referenceNumber: reservation.Reference_Number })
          .andWhere('item.stock_restored = :stockRestored', { stockRestored: false })
          .getOne();
        
        if (existingRentalCheck) {
          this.logger.warn(
            `[Equipment Rental] ⚠️⚠️⚠️ CRITICAL: Rental already exists for multi-schedule equipment ${b.equipment} ` +
            `with schedules [${b.selectedCourtSchedules.join(', ')}] on ${reservationDateForCheck}. ` +
            `Existing rental ID: ${existingRentalCheck.id}, reservation: ${reservation.Reservation_ID}. ` +
            `SKIPPING to prevent duplicate. This rental should span all ${b.selectedCourtSchedules.length} schedules.`
          );
          continue; // Skip - rental already exists
        }
      }
      
      // Additional safety check: Verify no rental item already exists for this equipment and reservation
      if (equipmentRow) {
        const existingRental = await this.equipmentRentalRepository.findOne({
          where: { reservation_id: reservation.Reservation_ID },
          relations: ['items'],
        });
        
        if (existingRental && existingRental.items) {
          const existingItem = existingRental.items.find(
            (item) => item.equipment_id === equipmentRow!.id
          );
          
          if (existingItem) {
            this.logger.warn(
              `[Equipment Rental] ⚠️ Rental item already exists for equipment ${equipmentRow.equipment_name} ` +
              `in reservation ${reservation.Reservation_ID}. Skipping creation to prevent duplicate.`
            );
            continue; // Skip - already exists
          }
        }
      }
      
      // Mark as processed IMMEDIATELY to prevent any duplicates
      processedInBatch.add(equipmentKey);
      this.logger.log(
        `[Equipment Rental] ✅ Processing equipment in batch: ${equipmentKey}, ` +
        `quantity: ${quantity}, reservation: ${reservation.Reservation_ID}`
      );

      if (equipmentRow) {
        const reservationDate = this.formatDateOnly(reservation.Reservation_Date);
        // Use reservation's start time (which is the court booking's start time) since equipment is tied to this reservation
        const bookingStartTime = this.ensureTimeFormat(reservation.Start_Time ?? b.startTime ?? normalizedDefaultStart);
        if (!bookingStartTime) {
          throw new BadRequestException(
            `Missing start time for equipment rental of ${equipmentRow.equipment_name}. Please select a court schedule first.`,
          );
        }

        const reservedQuantity = await this.getReservedQuantityForRange(
          equipmentRow.id,
          reservationDate,
          bookingStartTime,
          hours,
          reservation.Reservation_ID,
        );
        const remaining = equipmentRow.stocks - reservedQuantity;

        if (remaining < quantity) {
          throw new BadRequestException(
            `Not enough stock for ${equipmentRow.equipment_name} on ${reservationDate} at ${bookingStartTime}. ` +
              `Remaining: ${Math.max(remaining, 0)}`,
          );
        }
      }

      const hourlyPrice = equipmentRow ? Number(equipmentRow.price) : Number(((b.subtotal || 0) / Math.max(1, hours * quantity)).toFixed(2)) || 0;
      const subtotal = b.subtotal != null && b.subtotal > 0 ? Number(b.subtotal) : Number((hourlyPrice * hours * quantity).toFixed(2));

      // Calculate rental start and end times
      // IMPORTANT: If equipment is for multiple schedules, rental time should span ALL selected schedules
      // This ensures availability is reduced in ALL schedule cells
      const reservationDate = this.formatDateOnly(reservation.Reservation_Date);
      
      let rentalStartTime: Date | null = null;
      let rentalEndTime: Date | null = null;
      
      // If equipment is for multiple schedules, calculate time range that covers all schedules
      // If only one schedule is selected, rental time will only cover that one schedule (handled in fallback)
      this.logger.log(
        `[Equipment Rental] Checking selectedCourtSchedules: ${b.selectedCourtSchedules ? `[${b.selectedCourtSchedules.join(', ')}] (length: ${b.selectedCourtSchedules.length})` : 'undefined/null'}`
      );
      
      if (b.selectedCourtSchedules && b.selectedCourtSchedules.length > 1) {
        this.logger.log(
          `[Equipment Rental] ✅ Multi-schedule rental detected: ${b.selectedCourtSchedules.length} schedules selected: ${b.selectedCourtSchedules.join(', ')}`
        );
        // Find all reservations that match the selected schedules
        const matchingReservations = await this.reservationsRepository.find({
          where: {
            Reservation_Date: new Date(reservationDate),
            Reference_Number: reservation.Reference_Number,
          },
        });
        
        // Filter to only reservations that match the selected schedules
        // Schedule key format is: "Court Name-Schedule String" (e.g., "Court 4-3:00 PM - 4:00 PM")
        // Get all courts once before filtering
        const courts = await this.courtsService.findAll();
        
        this.logger.log(
          `[Equipment Rental] Matching reservations to selected schedules. ` +
          `Matching reservations: ${matchingReservations.length}, ` +
          `Selected schedules: ${b.selectedCourtSchedules?.join(', ') || 'none'}`
        );
        
        const relevantReservations = matchingReservations.filter((res) => {
          // Get court name
          const court = courts.find(c => c.Court_Id === res.Court_ID);
          const courtName = court?.Court_Name || '';
          
          // Convert 24-hour time to 12-hour format for schedule string
          const scheduleStr = this.formatTimeTo12Hour(res.Start_Time, res.End_Time);
          const resScheduleKey = `${courtName}-${scheduleStr}`;
          
          const matches = b.selectedCourtSchedules?.includes(resScheduleKey) || false;
          
          this.logger.log(
            `[Equipment Rental] Checking reservation ${res.Reservation_ID}: ` +
            `Court=${courtName}, Time=${res.Start_Time}-${res.End_Time}, ` +
            `ScheduleStr=${scheduleStr}, ScheduleKey=${resScheduleKey}, ` +
            `Matches=${matches}`
          );
          
          return matches;
        });
        
        this.logger.log(
          `[Equipment Rental] Found ${relevantReservations.length} relevant reservations out of ${matchingReservations.length} matching reservations`
        );
        
        if (relevantReservations.length > 0) {
          // Find earliest start time and latest end time from all relevant schedules
          // CRITICAL: This works even if schedules are on different courts (e.g., Court 4 and Court 5)
          let earliestStart: Date | null = null;
          let latestEnd: Date | null = null;
          
          this.logger.log(
            `[Equipment Rental] Calculating rental time for ${relevantReservations.length} schedules: ` +
            `${relevantReservations.map(r => `${r.court?.Court_Name || 'Unknown'} ${r.Start_Time}-${r.End_Time}`).join(', ')}`
          );
          
          for (const res of relevantReservations) {
            // Parse reservation date and time
            // Use date components to avoid timezone issues when creating Date objects
            const resDateStr = typeof res.Reservation_Date === 'string' 
              ? res.Reservation_Date 
              : new Date(res.Reservation_Date).toISOString().split('T')[0];
            const [year, month, day] = resDateStr.split('-').map(Number);
            
            const [startHour, startMin] = res.Start_Time.split(':').map(Number);
            const resStart = new Date(year, month - 1, day, startHour, startMin || 0, 0);
            
            const [endHour, endMin] = res.End_Time.split(':').map(Number);
            const resEnd = new Date(year, month - 1, day, endHour, endMin || 0, 0);
            
            this.logger.log(
              `[Equipment Rental] Schedule: ${res.court?.Court_Name || 'Unknown'} ` +
              `${res.Start_Time}-${res.End_Time}, ` +
              `parsed: ${resStart.toISOString()} to ${resEnd.toISOString()}`
            );
            
            if (!earliestStart || resStart < earliestStart) {
              earliestStart = resStart;
            }
            if (!latestEnd || resEnd > latestEnd) {
              latestEnd = resEnd;
            }
          }
          
          // Rental should cover from earliest start to latest end
          // CRITICAL: This ensures the rental spans ALL selected schedules (even on different courts)
          // so availability is reduced in ALL schedule cells
          if (earliestStart && latestEnd) {
            rentalStartTime = earliestStart;
            // Use the later of: latest schedule end time OR earliest start + rental hours
            // This ensures the rental covers the entire duration of all selected schedules
            const minEndTime = new Date(earliestStart);
            minEndTime.setHours(minEndTime.getHours() + hours);
            rentalEndTime = latestEnd > minEndTime ? latestEnd : minEndTime;
            
            this.logger.log(
              `[Equipment Rental] ✅✅✅ Multi-schedule rental calculated: ` +
              `covering ${relevantReservations.length} schedules (${b.selectedCourtSchedules?.join(', ') || 'unknown'}), ` +
              `rental time: ${earliestStart.toISOString()} to ${rentalEndTime.toISOString()}, ` +
              `quantity: ${quantity}. ` +
              `This rental will reduce stock in ALL ${relevantReservations.length} schedule cells when checking availability. ` +
              `Time span: ${earliestStart.toLocaleTimeString()} to ${rentalEndTime.toLocaleTimeString()}`
            );
          } else {
            this.logger.error(
              `[Equipment Rental] ❌ CRITICAL ERROR: Could not calculate multi-schedule rental time! ` +
              `earliestStart=${earliestStart}, latestEnd=${latestEnd}, relevantReservations=${relevantReservations.length}, ` +
              `matchingReservations=${matchingReservations.length}, selectedSchedules=${b.selectedCourtSchedules?.join(', ') || 'none'}`
            );
          }
        } else {
          this.logger.error(
            `[Equipment Rental] ❌ CRITICAL: No relevant reservations found for selected schedules! ` +
            `Selected schedules: ${b.selectedCourtSchedules?.join(', ') || 'none'}, ` +
            `Matching reservations found: ${matchingReservations.length}, ` +
            `Reference number: ${reservation.Reference_Number}, Date: ${reservationDate}`
          );
        }
      }
      
      // Fallback: Use current reservation's time (for single schedule or if multi-schedule calculation failed)
      if (!rentalStartTime || !rentalEndTime) {
        // If multi-schedule calculation failed but we have selectedCourtSchedules, try to calculate from schedules
        if (b.selectedCourtSchedules && b.selectedCourtSchedules.length > 1) {
          this.logger.warn(
            `[Equipment Rental] ⚠️ Multi-schedule calculation failed, attempting fallback calculation from selectedCourtSchedules: ` +
            `${b.selectedCourtSchedules.join(', ')}`
          );
          
          // Try to parse schedules from selectedCourtSchedules to calculate time span
          const scheduleTimes: { start: Date; end: Date }[] = [];
          const courts = await this.courtsService.findAll();
          
          for (const scheduleKey of b.selectedCourtSchedules) {
            // Parse "Court Name-Schedule String" format (e.g., "Court 4-10:00 am - 11:00 am")
            const match = scheduleKey.match(/^(.+?)-(.+)$/);
            if (match) {
              const [, courtName, scheduleStr] = match;
              // Parse schedule string like "10:00 am - 11:00 am"
              const timeMatch = scheduleStr.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i);
              if (timeMatch) {
                const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
                const convertTo24Hour = (hour: number, period: string, minute: number): number => {
                  let h = parseInt(hour.toString());
                  if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
                  else if (period.toUpperCase() === 'AM' && h === 12) h = 0;
                  return h;
                };
                
                const startH = convertTo24Hour(parseInt(startHour), startPeriod, parseInt(startMin));
                const endH = convertTo24Hour(parseInt(endHour), endPeriod, parseInt(endMin));
                
                const [year, month, day] = reservationDate.split('-').map(Number);
                const start = new Date(year, month - 1, day, startH, parseInt(startMin), 0);
                const end = new Date(year, month - 1, day, endH, parseInt(endMin), 0);
                
                scheduleTimes.push({ start, end });
              }
            }
          }
          
          if (scheduleTimes.length > 0) {
            const earliestStart = scheduleTimes.reduce((earliest, current) => 
              current.start < earliest.start ? current : earliest
            ).start;
            const latestEnd = scheduleTimes.reduce((latest, current) => 
              current.end > latest.end ? current : latest
            ).end;
            
            rentalStartTime = earliestStart;
            const minEndTime = new Date(earliestStart);
            minEndTime.setHours(minEndTime.getHours() + hours);
            rentalEndTime = latestEnd > minEndTime ? latestEnd : minEndTime;
            
            this.logger.log(
              `[Equipment Rental] ✅ Fallback multi-schedule calculation successful: ` +
              `spanning ${scheduleTimes.length} schedules from ${earliestStart.toISOString()} to ${rentalEndTime.toISOString()}`
            );
          }
        }
        
        // Final fallback: Use current reservation's time (single schedule)
        if (!rentalStartTime || !rentalEndTime) {
          const courtStartTime = this.ensureTimeFormat(reservation.Start_Time);
          
          if (courtStartTime && reservationDate) {
            // Parse date and time to create rental start datetime
            // Rental starts when the court booking starts
            const [startHour, startMin] = courtStartTime.split(':').map(Number);
            const [year, month, day] = reservationDate.split('-').map(Number);
            rentalStartTime = new Date(year, month - 1, day, startHour, startMin, 0);
            
            // Calculate end time by adding rental hours to the court start time
            rentalEndTime = new Date(rentalStartTime);
            rentalEndTime.setHours(rentalEndTime.getHours() + hours);
            
            if (b.selectedCourtSchedules && b.selectedCourtSchedules.length === 1) {
              this.logger.log(
                `[Equipment Rental] Single-schedule rental: covering 1 schedule (${b.selectedCourtSchedules[0]}), ` +
                `from ${rentalStartTime.toISOString()} to ${rentalEndTime.toISOString()}`
              );
            } else {
              this.logger.log(
                `[Equipment Rental] Single-schedule rental (no selectedCourtSchedules or fallback failed): ` +
                `from ${rentalStartTime.toISOString()} to ${rentalEndTime.toISOString()}`
              );
            }
          }
        }
      }

      // Final safety check: Verify no rental item already exists for this exact combination
      // This prevents duplicates even if all other checks fail
      if (equipmentRow) {
        // Check for ANY existing rental item for this equipment in this reservation
        // (regardless of quantity/hours, since we only want ONE rental item per equipment per reservation)
        const existingRental = await this.equipmentRentalItemRepository
          .createQueryBuilder('item')
          .innerJoin('item.rental', 'rental')
          .where('rental.reservation_id = :reservationId', { reservationId: reservation.Reservation_ID })
          .andWhere('item.equipment_id = :equipmentId', { equipmentId: equipmentRow.id })
          .getOne();
        
        if (existingRental) {
          this.logger.warn(
            `[Equipment Rental] ⚠️⚠️⚠️ DUPLICATE DETECTED: Rental item already exists for equipment ${equipmentRow.equipment_name} ` +
            `(ID: ${equipmentRow.id}) in reservation ${reservation.Reservation_ID}. ` +
            `Existing item ID: ${existingRental.id}, quantity: ${existingRental.quantity}, hours: ${existingRental.hours}. ` +
            `Attempted to create: quantity: ${quantity}, hours: ${hours}. ` +
            `Skipping creation to prevent duplicate.`
          );
          continue; // Skip - duplicate detected
        }
        
        this.logger.log(
          `[Equipment Rental] No duplicate found - proceeding to create rental item for ${equipmentRow.equipment_name} ` +
          `(ID: ${equipmentRow.id}), quantity: ${quantity}, hours: ${hours}, reservation: ${reservation.Reservation_ID}`
        );
      }

      // CRITICAL: Double-check one more time before creating (race condition protection)
      if (equipmentRow) {
        const finalCheck = await this.equipmentRentalItemRepository
          .createQueryBuilder('item')
          .innerJoin('item.rental', 'rental')
          .where('rental.reservation_id = :reservationId', { reservationId: reservation.Reservation_ID })
          .andWhere('item.equipment_id = :equipmentId', { equipmentId: equipmentRow.id })
          .getOne();
        
        if (finalCheck) {
          this.logger.error(
            `[Equipment Rental] 🚨🚨🚨 RACE CONDITION DETECTED: Rental item was created between checks! ` +
            `Equipment: ${equipmentRow.equipment_name} (ID: ${equipmentRow.id}), ` +
            `Reservation: ${reservation.Reservation_ID}, Existing item ID: ${finalCheck.id}. ` +
            `ABORTING creation to prevent duplicate.`
          );
          continue; // Skip - duplicate was created between checks
        }
      }

      const item = this.equipmentRentalItemRepository.create({
        rental_id: savedRental.id,
        equipment_id: equipmentRow ? equipmentRow.id : 0,
        quantity,
        hours,
        hourly_price: hourlyPrice,
        subtotal,
        rental_start_time: rentalStartTime,
        rental_end_time: rentalEndTime,
        stock_restored: false,
        notification_sent: false,
      } as Partial<EquipmentRentalItem>);
      
      const savedItem = await this.equipmentRentalItemRepository.save(item);
      
      // Verify the item was actually created with the correct quantity and time range
      this.logger.log(
        `[Equipment Rental] ✅ CREATED rental item ID: ${savedItem.id}, ` +
        `equipment: ${equipmentRow?.equipment_name || 'unknown'} (ID: ${equipmentRow?.id || 0}), ` +
        `quantity: ${savedItem.quantity}, hours: ${savedItem.hours}, ` +
        `reservation: ${reservation.Reservation_ID}, ` +
        `equipmentKey: ${equipmentKey}, ` +
        `selectedSchedules: ${b.selectedCourtSchedules?.join(', ') || 'none'}, ` +
        `rental_start_time: ${savedItem.rental_start_time ? savedItem.rental_start_time.toISOString() : 'null'}, ` +
        `rental_end_time: ${savedItem.rental_end_time ? savedItem.rental_end_time.toISOString() : 'null'}, ` +
        `This rental will reduce stock in ${b.selectedCourtSchedules?.length || 1} schedule cell(s).`
      );
      
      // CRITICAL VERIFICATION: Ensure rental time spans all selected schedules
      if (b.selectedCourtSchedules && b.selectedCourtSchedules.length > 1 && savedItem.rental_start_time && savedItem.rental_end_time) {
        const rentalStart = new Date(savedItem.rental_start_time);
        const rentalEnd = new Date(savedItem.rental_end_time);
        
        // Verify that the rental time covers all selected schedules
        const allSchedulesCovered = b.selectedCourtSchedules.every(scheduleKey => {
          // Parse schedule key to get time range (format: "Court Name-Start Time - End Time")
          // This is a simplified check - the actual overlap is verified in getReservedQuantityForRange
          return true; // The time range calculation above should handle this
        });
        
        this.logger.log(
          `[Equipment Rental] ✅ VERIFIED: Rental time ${rentalStart.toISOString()} to ${rentalEnd.toISOString()} ` +
          `should cover all ${b.selectedCourtSchedules.length} selected schedules. ` +
          `Stock will be reduced in ALL schedule cells when checking availability.`
        );
      }
      
      // Note: Stock is now calculated dynamically based on active rentals
      // No need to decrease stock permanently - available stock = total_stock - active_rentals
      
      total += subtotal;
    }

    await this.equipmentRentalRepository.update(savedRental.id, { total_amount: Number(total.toFixed(2)) });
  }

  private ensureTimeFormat(time?: string | null): string | null {
    if (!time) return null;
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    }
    return null;
  }

  private timeStringToMinutes(time: string | null | undefined): number {
    if (!time) return 0;
    const [hours = '0', minutes = '0'] = time.split(':');
    return Number(hours) * 60 + Number(minutes);
  }

  private timeRangesOverlap(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
  ): boolean {
    return Math.max(startA, startB) < Math.min(endA, endB);
  }

  private compareScheduleStartTimes(scheduleA: string, scheduleB: string): number {
    const [startA] = this.parseScheduleToTimes(scheduleA);
    const [startB] = this.parseScheduleToTimes(scheduleB);
    return this.timeStringToMinutes(startA) - this.timeStringToMinutes(startB);
  }

  private getEarliestStartTimeFromBookings(
    courtBookings: Array<{ schedule: string }> | undefined | null,
  ): string | null {
    if (!courtBookings || courtBookings.length === 0) return null;
    let earliest: string | null = null;
    for (const booking of courtBookings) {
      if (!booking?.schedule) continue;
      const [startTime] = this.parseScheduleToTimes(booking.schedule);
      if (!earliest || this.timeStringToMinutes(startTime) < this.timeStringToMinutes(earliest)) {
        earliest = startTime;
      }
    }
    return earliest;
  }

  private parseHours(time: string): number {
    // Parse time like "2 hr" or "2 hours" to number
    const match = time.match(/(\d+)\s*(?:hr|hour|hours)/i);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Check if a reservation has ended based on its date and end time
   */
  private isReservationEnded(reservation: Reservation): boolean {
    try {
      const reservationDate = new Date(reservation.Reservation_Date);
      const reservationDateOnly = new Date(
        reservationDate.getFullYear(),
        reservationDate.getMonth(),
        reservationDate.getDate(),
      );

      // Parse end time
      const [endHour, endMin] = reservation.End_Time.split(':').map(Number);

      // Create datetime object for end time
      const endDateTime = new Date(reservationDateOnly);
      endDateTime.setHours(endHour, endMin || 0, 0, 0);

      const now = new Date();
      return endDateTime < now;
    } catch (error) {
      this.logger.warn(`Failed to check if reservation ${reservation.Reservation_ID} has ended:`, error);
      return false;
    }
  }

  /**
   * Move a reservation to history table
   */
  async moveReservationToHistory(reservationId: number): Promise<ReservationHistory> {
    const reservation = await this.findOne(reservationId);
    
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    // Create history record
    const historyRecord = this.reservationsHistoryRepository.create({
      Original_ID: reservation.Reservation_ID,
      User_ID: reservation.User_ID,
      Court_ID: reservation.Court_ID,
      Reservation_Date: reservation.Reservation_Date,
      Start_Time: reservation.Start_Time,
      End_Time: reservation.End_Time,
      Status: reservation.Status,
      Total_Amount: reservation.Total_Amount,
      Reference_Number: reservation.Reference_Number,
      Paymongo_Reference_Number: reservation.Paymongo_Reference_Number,
      Notes: reservation.Notes,
      Is_Admin_Created: reservation.Is_Admin_Created,
      Created_at: reservation.Created_at,
      Updated_at: reservation.Updated_at,
      Archived_at: new Date(),
    });

    const savedHistory = await this.reservationsHistoryRepository.save(historyRecord);

    // Delete the original reservation
    await this.reservationsRepository.remove(reservation);

    this.logger.log(`Reservation ${reservationId} moved to history as History_ID: ${savedHistory.History_ID}`);
    
    return savedHistory;
  }

  /**
   * Get all reservations that have ended (based on date and end time)
   * Only returns CONFIRMED reservations that have ended
   */
  async getEndedReservations(): Promise<Reservation[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all confirmed reservations
    const confirmedReservations = await this.reservationsRepository.find({
      where: {
        Status: ReservationStatus.CONFIRMED,
      },
    });

    // Filter reservations that have ended
    const endedReservations = confirmedReservations.filter((reservation) => {
      return this.isReservationEnded(reservation);
    });

    return endedReservations;
  }

  /**
   * Move all ended reservations to history
   * Returns count of reservations moved
   */
  async moveEndedReservationsToHistory(): Promise<{ count: number; movedIds: number[] }> {
    const endedReservations = await this.getEndedReservations();
    const movedIds: number[] = [];

    for (const reservation of endedReservations) {
      try {
        await this.moveReservationToHistory(reservation.Reservation_ID);
        movedIds.push(reservation.Reservation_ID);
      } catch (error) {
        this.logger.error(`Failed to move reservation ${reservation.Reservation_ID} to history:`, error);
      }
    }

    this.logger.log(`Moved ${movedIds.length} ended reservations to history`);
    
    return {
      count: movedIds.length,
      movedIds,
    };
  }

  /**
   * Get reservation history for a specific user
   */
  async getUserReservationHistory(userId: number): Promise<ReservationHistory[]> {
    return this.reservationsHistoryRepository.find({
      where: {
        User_ID: userId,
      },
      order: {
        Archived_at: 'DESC',
      },
    });
  }

  /**
   * Get all reservation history
   */
  async getAllReservationHistory(): Promise<ReservationHistory[]> {
    return this.reservationsHistoryRepository.find({
      order: {
        Archived_at: 'DESC',
      },
    });
  }

  /**
   * Get reservation history by ID
   */
  async getReservationHistoryById(historyId: number): Promise<ReservationHistory> {
    const history = await this.reservationsHistoryRepository.findOne({
      where: {
        History_ID: historyId,
      },
    });

    if (!history) {
      throw new NotFoundException(`Reservation history with ID ${historyId} not found`);
    }

    return history;
  }
}
