import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
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
import { PaymongoQrPhCode } from '../payments/types/paymongo.types';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
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

  async findAll(): Promise<Reservation[]> {
    return this.reservationsRepository.find({
      relations: ['user', 'court'],
      order: { Created_at: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Reservation[]> {
    return this.reservationsRepository.find({
      where: { User_ID: userId, Is_Admin_Created: false },
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
        );
      }

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
          Is_Admin_Created: false,
        });

        const savedReservation = await this.reservationsRepository.save(reservation);
        reservations.push(savedReservation);

        // Create payment record for this reservation
        await this.createPaymentRecord(savedReservation, actualPaymentId, amount, bookingData, actualPaymentMethod);

        if (bookingData.equipmentBookings?.length) {
          await this.createEquipmentRentalsFromBooking(
            bookingData.userId,
            savedReservation,
            bookingData.equipmentBookings,
            fallbackEquipmentStart,
          );
        }
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
  ): Promise<{ isDuplicate: boolean; message?: string }> {
    try {
      // Parse the date string
      const reservationDate = new Date(date);
      reservationDate.setHours(0, 0, 0, 0);

      // Check if user has an existing reservation with the same court, date, and time
      const existingReservation = await this.reservationsRepository.findOne({
        where: {
          User_ID: userId,
          Court_ID: courtId,
          Reservation_Date: reservationDate,
          Start_Time: startTime,
          End_Time: endTime,
          Status: ReservationStatus.CONFIRMED,
        },
      });

      if (existingReservation) {
        return {
          isDuplicate: true,
          message: 'You have already booked this court for the same date and time.',
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicate reservation:', error);
      // Return false on error to allow booking (fail-safe)
      return { isDuplicate: false };
    }
  }

  private async getOrCreateGuestUser(
    customerName: string,
    customerEmail?: string,
    customerContact?: string,
  ): Promise<User> {
    const sanitizedName = customerName?.trim() || 'Walk-in Customer';
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

  async createWithCashPayment(
    customerName: string,
    bookingData: any,
    customerContact?: string,
    customerEmail?: string,
  ): Promise<{ reservations: Reservation[]; payment: Payment }> {
    try {
      const sanitizedName = customerName?.trim() || 'Walk-in Customer';
      const sanitizedContact = customerContact?.trim();
      const sanitizedEmail = customerEmail?.trim();

      const { reservations, totalAmount, referenceNumber } =
        await this.createWalkInReservationsAndRentals(
          sanitizedName,
          bookingData,
          'Payment via Cash',
          sanitizedContact,
          sanitizedEmail,
        );

      if (!reservations.length) {
        throw new BadRequestException('No reservations were created for this booking.');
      }

      const customerDetailsNote = this.buildCustomerDetailsNote(
        sanitizedName,
        sanitizedContact,
        sanitizedEmail,
      );

      const payment = this.paymentRepository.create({
        reservation_id: reservations[0].Reservation_ID,
        amount: totalAmount,
        payment_method: PaymentMethod.CASH,
        transaction_id: `CASH${Date.now()}${Math.floor(Math.random() * 1000)}`,
        reference_number: referenceNumber || reservations[0].Reference_Number,
        notes: `Payment received in cash - ${customerDetailsNote}`,
        status: PaymentStatus.COMPLETED,
      });

      const savedPayment = await this.paymentRepository.save(payment);

      return { reservations, payment: savedPayment };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create reservation with cash payment: ${error.message}`,
      );
    }
  }

  async generateQrPhPreview(
    customerName: string,
    qrDetails?: { notes?: string; mobileNumber?: string; kind?: 'instore' | 'dynamic' | string },
  ): Promise<{ qrData: PaymongoQrPhCode }> {
    try {
      const sanitizedName = customerName?.trim() || 'Walk-in Customer';
      const effectiveNotes =
        qrDetails?.notes?.trim() || `Reservation - ${sanitizedName}`;

      const qrData = await this.payMongoService.generateQrPhStaticCode({
        mobileNumber: qrDetails?.mobileNumber,
        notes: effectiveNotes,
        kind: qrDetails?.kind || 'instore',
      });

      return { qrData };
    } catch (error) {
      throw new BadRequestException(`Failed to generate QR Ph code preview: ${error.message}`);
    }
  }

  async createWithQrPhPayment(
    customerName: string,
    bookingData: any,
    customerContact?: string,
    customerEmail?: string,
    qrDetails?: { notes?: string; mobileNumber?: string; kind?: 'instore' | 'dynamic' | string },
    existingQrData?: PaymongoQrPhCode,
  ): Promise<{ reservations: Reservation[]; payment: Payment; qrData: PaymongoQrPhCode }> {
    try {
      const sanitizedName = customerName?.trim() || 'Walk-in Customer';
      const sanitizedContact = customerContact?.trim();
      const sanitizedEmail = customerEmail?.trim();

      const { reservations, totalAmount, referenceNumber } =
        await this.createWalkInReservationsAndRentals(
          sanitizedName,
          bookingData,
          'Payment via PayMongo QR Ph',
          sanitizedContact,
          sanitizedEmail,
        );

      if (!reservations.length) {
        throw new BadRequestException('No reservations were created for this booking.');
      }

      const effectiveNotes =
        qrDetails?.notes ||
        existingQrData?.attributes?.notes ||
        `Reservation ${referenceNumber || reservations[0].Reference_Number} - ${sanitizedName}`;

      const qrData =
        existingQrData && existingQrData.id
          ? existingQrData
          : await this.payMongoService.generateQrPhStaticCode({
              mobileNumber: qrDetails?.mobileNumber,
              notes: effectiveNotes,
              kind: qrDetails?.kind || existingQrData?.attributes?.kind || 'instore',
            });

      const customerDetailsNote = this.buildCustomerDetailsNote(
        sanitizedName,
        sanitizedContact,
        sanitizedEmail,
      );

      const payment = this.paymentRepository.create({
        reservation_id: reservations[0].Reservation_ID,
        amount: totalAmount,
        payment_method: PaymentMethod.QRPH,
        transaction_id: qrData.id,
        reference_number: referenceNumber || reservations[0].Reference_Number,
        notes: `Pay via QR Ph code generated (${qrData.id}). ${
          qrData.attributes.notes ? `Notes: ${qrData.attributes.notes}. ` : ''
        }${customerDetailsNote}`,
        status: PaymentStatus.PENDING,
      });

      const savedPayment = await this.paymentRepository.save(payment);

      return { reservations, payment: savedPayment, qrData };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create reservation with QR Ph payment: ${error.message}`,
      );
    }
  }

  private async createWalkInReservationsAndRentals(
    customerName: string,
    bookingData: any,
    reservationNotePrefix: string,
    customerContact?: string,
    customerEmail?: string,
  ): Promise<{
    reservations: Reservation[];
    totalAmount: number;
    referenceNumber: string;
  }> {
    const bookingCustomerDetails = bookingData?.customerDetails ?? {};
    const bookingContact =
      typeof bookingCustomerDetails?.contactNumber === 'string'
        ? bookingCustomerDetails.contactNumber
        : typeof bookingCustomerDetails?.contact === 'string'
        ? bookingCustomerDetails.contact
        : typeof bookingCustomerDetails?.phone === 'string'
        ? bookingCustomerDetails.phone
        : '';
    const bookingEmail =
      typeof bookingCustomerDetails?.email === 'string'
        ? bookingCustomerDetails.email
        : typeof bookingCustomerDetails?.emailAddress === 'string'
        ? bookingCustomerDetails.emailAddress
        : '';

    const effectiveContact = (customerContact ?? bookingContact)?.trim() || undefined;
    const effectiveEmail = (customerEmail ?? bookingEmail)?.trim() || undefined;

    const user = await this.getOrCreateGuestUser(customerName, effectiveEmail, effectiveContact);
    const userId = user.id;

    const { selectedDate, courtBookings, equipmentBookings, referenceNumber, equipmentStartTime } =
      bookingData;

    const reservations: Reservation[] = [];
    let totalAmount = 0;

    const sortedCourtBookings = Array.isArray(courtBookings)
      ? [...courtBookings].sort((a, b) =>
          this.compareScheduleStartTimes(a?.schedule ?? '', b?.schedule ?? ''),
        )
      : [];

    if (!sortedCourtBookings.length) {
      throw new BadRequestException('At least one court booking is required to create a reservation.');
    }

    const customerDetailsNote = this.buildCustomerDetailsNote(
      customerName,
      effectiveContact,
      effectiveEmail,
    );

    const fallbackEquipmentStart =
      equipmentStartTime ||
      this.getEarliestStartTimeFromBookings(sortedCourtBookings) ||
      this.getEarliestStartTimeFromBookings(courtBookings || []);

    if (equipmentBookings && equipmentBookings.length > 0) {
      await this.ensureEquipmentAvailabilityForDate(
        selectedDate,
        equipmentBookings,
        fallbackEquipmentStart,
      );
    }

    let equipmentHandled = false;
    let effectiveReferenceNumber = referenceNumber || '';

    for (const courtBooking of sortedCourtBookings) {
      const courts = await this.courtsService.findAll();
      const court = courts.find((c) => c.Court_Name === courtBooking.court);

      if (!court) {
        throw new BadRequestException(`Court "${courtBooking.court}" not found`);
      }

      const [startTime, endTime] = this.parseScheduleToTimes(courtBooking.schedule);

      const reservation = this.reservationsRepository.create({
        User_ID: userId,
        Court_ID: court.Court_Id,
        Reservation_Date: new Date(selectedDate),
        Start_Time: startTime,
        End_Time: endTime,
        Total_Amount: courtBooking.subtotal,
        Reference_Number: referenceNumber || `REF${Date.now()}`,
        Notes: `${reservationNotePrefix} - ${customerDetailsNote}`,
        Status: ReservationStatus.CONFIRMED,
        Is_Admin_Created: true,
      });

      const savedReservation = await this.reservationsRepository.save(reservation);
      reservations.push(savedReservation);
      totalAmount += Number(courtBooking.subtotal || 0);

      if (!effectiveReferenceNumber) {
        effectiveReferenceNumber = savedReservation.Reference_Number;
      }

      if (!equipmentHandled && equipmentBookings && equipmentBookings.length > 0) {
        await this.createEquipmentRentalsFromBooking(
          userId,
          savedReservation,
          equipmentBookings,
          fallbackEquipmentStart,
        );
        equipmentHandled = true;

        const equipmentTotal = equipmentBookings.reduce(
          (sum: number, b: any) => sum + Number(b.subtotal || 0),
          0,
        );
        totalAmount += equipmentTotal;
      }
    }

    return {
      reservations,
      totalAmount,
      referenceNumber:
        effectiveReferenceNumber || referenceNumber || reservations[0].Reference_Number,
    };
  }

  private buildCustomerDetailsNote(
    customerName: string,
    customerContact?: string,
    customerEmail?: string,
  ): string {
    const details: string[] = [`Walk-in customer: ${customerName}`];

    const trimmedContact = customerContact?.trim();
    const trimmedEmail = customerEmail?.trim();

    if (trimmedContact) {
      details.push(`Contact: ${trimmedContact}`);
    }

    if (trimmedEmail) {
      details.push(`Email: ${trimmedEmail}`);
    }

    return details.join(' | ');
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
    const query = this.equipmentRentalItemRepository
      .createQueryBuilder('item')
      .innerJoin(EquipmentRental, 'rental', 'rental.id = item.rental_id')
      .innerJoin(Reservation, 'reservation', 'reservation.Reservation_ID = rental.reservation_id')
      .where('item.equipment_id = :equipmentId', { equipmentId })
      .andWhere('reservation.Reservation_Date = :reservationDate', { reservationDate })
      .andWhere('reservation.Status IN (:...statuses)', {
        statuses: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING, ReservationStatus.COMPLETED],
      });

    if (excludeReservationId) {
      query.andWhere('reservation.Reservation_ID != :excludeReservationId', { excludeReservationId });
    }

    const rows = await query
      .select([
        'item.quantity AS item_quantity',
        'item.hours AS item_hours',
        'reservation.Start_Time AS reservation_start',
      ])
      .getRawMany<{ item_quantity: string; item_hours: string; reservation_start: string }>();

    if (!startTime || !hours) {
      return rows.reduce((sum, row) => sum + Number(row.item_quantity ?? 0), 0);
    }

    const targetStart = this.timeStringToMinutes(startTime);
    const targetEnd = targetStart + hours * 60;

    return rows.reduce((sum, row) => {
      const existingStart = this.timeStringToMinutes(row.reservation_start);
      const existingHours = Number(row.item_hours ?? 0);
      const existingEnd = existingStart + existingHours * 60;

      return this.timeRangesOverlap(targetStart, targetEnd, existingStart, existingEnd)
        ? sum + Number(row.item_quantity ?? 0)
        : sum;
    }, 0);
  }

  private async ensureEquipmentAvailabilityForDate(
    dateInput: string | Date,
    equipmentBookings: Array<{ equipment: string; time: string; subtotal?: number; quantity?: number; startTime?: string }>,
    defaultStartTime?: string | null,
    excludeReservationId?: number,
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

  private async createEquipmentRentalsFromBooking(
    userId: number,
    reservation: Reservation,
    equipmentBookings: Array<{ equipment: string; time: string; subtotal?: number; quantity?: number; startTime?: string }>,
    defaultStartTime?: string | null,
  ) {
    if (!reservation?.Reservation_ID || !userId || !equipmentBookings || equipmentBookings.length === 0) return;

    const normalizedDefaultStart = defaultStartTime ? this.ensureTimeFormat(defaultStartTime) : null;

    await this.ensureEquipmentAvailabilityForDate(
      reservation.Reservation_Date,
      equipmentBookings,
      normalizedDefaultStart,
      reservation.Reservation_ID,
    );

    const rental = this.equipmentRentalRepository.create({
      reservation_id: reservation.Reservation_ID,
      user_id: userId,
      total_amount: 0,
    });
    const savedRental = await this.equipmentRentalRepository.save(rental);

    let total = 0;
    for (const b of equipmentBookings) {
      const hours = this.parseHours(b.time);
      const quantity = b.quantity && b.quantity > 0 ? b.quantity : 1;

      let equipmentRow = await this.equipmentRepository.findOne({ where: { equipment_name: Like(`%${b.equipment}%`) } });
      if (!equipmentRow) {
        const fallbackRow = await this.equipmentRepository.findOne({ where: { equipment_name: b.equipment } });
        if (fallbackRow) {
          equipmentRow = fallbackRow;
        }
      }

      if (equipmentRow) {
        const reservationDate = this.formatDateOnly(reservation.Reservation_Date);
        const bookingStartTime = this.ensureTimeFormat(b.startTime ?? normalizedDefaultStart);
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

      const item = this.equipmentRentalItemRepository.create({
        rental_id: savedRental.id,
        equipment_id: equipmentRow ? equipmentRow.id : 0,
        quantity,
        hours,
        hourly_price: hourlyPrice,
        subtotal,
      });
      await this.equipmentRentalItemRepository.save(item);
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
}
