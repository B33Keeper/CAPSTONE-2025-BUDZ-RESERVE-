import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
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
    console.log(`[SalesReport Service] Fetching sales report between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    console.log(`[SalesReport Service] Using SAME logic as Admin Dashboard - fetch ALL reservations, filter by Created_at`);
    
    // Fetch all reservations exactly like Admin Dashboard does (same as /reservations endpoint)
    let reservations;
    try {
      console.log(`[SalesReport Service] Querying all reservations with relations (same as Admin Dashboard)...`);
      reservations = await this.reservationsRepository.find({
        relations: ['user', 'court', 'payments'],
        order: { Created_at: 'DESC' },
      });
      console.log(`[SalesReport Service] Found ${reservations.length} total reservations`);
      
      // Filter by Created_at (when reservation was created) - EXACTLY like Admin Dashboard
      // This matches AdminDashboard.tsx line 225-245
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);
      
      const filteredReservations = reservations.filter(reservation => {
        // Use Created_at as the primary source (when reservation was created) - SAME as Admin Dashboard
        const createdDateValue = reservation.Created_at;
        if (!createdDateValue) return false;
        
        const createdDate = new Date(createdDateValue);
        if (isNaN(createdDate.getTime())) return false;
        createdDate.setHours(0, 0, 0, 0);
        
        // Only include reservations created in the date range - SAME as Admin Dashboard
        return createdDate >= normalizedStartDate && createdDate <= normalizedEndDate;
      });
      
      reservations = filteredReservations;
      console.log(`[SalesReport Service] Found ${reservations.length} reservations created in date range (same logic as Admin Dashboard)`);
    } catch (error) {
      console.error(`[SalesReport Service] ERROR fetching reservations:`, error);
      console.error(`[SalesReport Service] Error stack:`, error.stack);
      throw error;
    }

    // Group reservations by transaction (Reference_Number or Paymongo_Reference_Number)
    const transactionMap = new Map<string, {
      reservations: Reservation[];
      payment: Payment | null;
      customerName: string;
      date: Date;
      paymentMethod: string;
      totalAmount: number;
      equipmentRentals: any[];
      courts: string[];
      times: string[];
      isCancelled: boolean;
    }>();

    // Format time helper
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'pm' : 'am';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
    };

    // Format date helper
    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    };

      // Group reservations by transaction (same grouping logic, but don't require completed payments)
      // IMPORTANT: All reservations from the same transaction share the same Reference_Number and Paymongo_Reference_Number
      for (const reservation of reservations) {
        // Skip cancelled reservations (SAME as Admin Dashboard - excludes cancelled)
        if (reservation.Status === ReservationStatus.CANCELLED) {
          continue;
        }
        
        // PRIMARY GROUPING: Use Reference_Number or Paymongo_Reference_Number
        // All reservations created from the same PayMongo payment share these values
        let transactionKey = reservation.Reference_Number || reservation.Paymongo_Reference_Number;
        
        // FALLBACK: If no reference numbers, try to use payment transaction_id (any payment, not just completed)
        const anyPayment = reservation.payments && reservation.payments.length > 0 
          ? reservation.payments[0] 
          : null;
        
        if (!transactionKey && anyPayment?.transaction_id) {
          transactionKey = anyPayment.transaction_id;
        }
        
        // FALLBACK: Last resort - unique key per reservation
        if (!transactionKey) {
          transactionKey = `${reservation.Reservation_Date}_${reservation.Start_Time}_${reservation.End_Time}_${reservation.Reservation_ID}`;
        }
      
      console.log(`[SalesReport] Processing reservation ${reservation.Reservation_ID}: Reference_Number=${reservation.Reference_Number}, Paymongo_Reference_Number=${reservation.Paymongo_Reference_Number}, PaymentTransactionID=${anyPayment?.transaction_id}, TransactionKey=${transactionKey}`);
      
      if (!transactionMap.has(transactionKey)) {
        // Create new transaction group
        console.log(`[SalesReport] Creating new transaction group: ${transactionKey}`);
        transactionMap.set(transactionKey, {
          reservations: [],
          payment: anyPayment || null, // Use any payment, not just completed
          customerName: reservation.user?.name || 'Unknown',
          date: reservation.Reservation_Date,
          paymentMethod: anyPayment?.payment_method || 'Pending',
          totalAmount: 0,
          equipmentRentals: [],
          courts: [],
          times: [],
          isCancelled: false,
        });
      }

      const transaction = transactionMap.get(transactionKey)!;
      
      // Update payment info if this reservation has a payment and the group doesn't have one yet
      if (!transaction.payment && anyPayment) {
        transaction.payment = anyPayment;
        transaction.date = reservation.Reservation_Date;
        transaction.paymentMethod = anyPayment.payment_method || 'Pending';
        console.log(`[SalesReport] Updated transaction ${transactionKey} with payment info from reservation ${reservation.Reservation_ID}`);
      }
      
      // Only add if not already in the array (prevent duplicates)
      if (!transaction.reservations.find(r => r.Reservation_ID === reservation.Reservation_ID)) {
        transaction.reservations.push(reservation);
        console.log(`[SalesReport] Added reservation ${reservation.Reservation_ID} to transaction ${transactionKey} (total reservations in group: ${transaction.reservations.length})`);
      } else {
        console.log(`[SalesReport] Reservation ${reservation.Reservation_ID} already in transaction ${transactionKey}, skipping duplicate`);
      }
      
      // Add court and time to the transaction (allow duplicates to show all bookings)
      const courtName = reservation.court?.Court_Name || 'Unknown';
      transaction.courts.push(courtName); // Allow duplicates to show all court bookings
      
      const timeStr = `${formatTime(reservation.Start_Time)}-${formatTime(reservation.End_Time)}`;
      transaction.times.push(timeStr); // Allow duplicates to show all time slots

      // Calculate amount EXACTLY like Admin Dashboard does (extractReservationAmount logic)
      // First try payments (sum of all payment amounts, not just completed)
      let reservationAmount = 0;
      if (reservation.payments && Array.isArray(reservation.payments)) {
        reservationAmount = reservation.payments.reduce((sum: number, payment: any) => {
          const amount = Number(payment?.amount ?? 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      }
      
      // If no payments, fall back to Total_Amount (SAME as Admin Dashboard)
      if (reservationAmount === 0) {
        reservationAmount = Number(reservation.Total_Amount) || 0;
      }
      
      transaction.totalAmount += reservationAmount;
      
      console.log(`[SalesReport] Transaction ${transactionKey}: Added reservation ${reservation.Reservation_ID} - Court: ${courtName}, Time: ${timeStr}, Amount: ${reservationAmount}, Total so far: ${transaction.totalAmount}`);

      // Note: Cancelled reservations are already filtered out at the start of the loop,
      // so we don't need to check for cancelled status here

      // Fetch equipment rentals for this reservation
      try {
        const rental = await this.equipmentRentalRepository.findOne({
          where: { reservation_id: reservation.Reservation_ID },
          relations: ['items'],
        });

        if (rental) {
          // Add equipment rental total amount to transaction total
          const rentalTotalAmount = Number(rental.total_amount) || 0;
          transaction.totalAmount += rentalTotalAmount;
          console.log(`[SalesReport] Transaction ${transactionKey}: Added equipment rental total ${rentalTotalAmount} for reservation ${reservation.Reservation_ID}, New total: ${transaction.totalAmount}`);

          if (rental.items && rental.items.length > 0) {
            const items = await this.equipmentRentalItemRepository.find({
              where: { rental_id: rental.id },
            });

            for (const item of items) {
              const equipment = await this.equipmentRepository.findOne({
                where: { id: item.equipment_id },
              });

              // Check if this equipment is already in the transaction's equipment list
              const existingEquipment = transaction.equipmentRentals.find(
                (eq: any) => eq.equipmentName === (equipment?.equipment_name || 'Equipment') && eq.hours === item.hours
              );

              if (existingEquipment) {
                // Add to quantity if same equipment and hours
                existingEquipment.quantity += item.quantity;
              } else {
                // Add new equipment
                transaction.equipmentRentals.push({
                  equipmentName: equipment?.equipment_name || 'Equipment',
                  quantity: item.quantity,
                  hours: item.hours,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`[SalesReport Service] Error fetching equipment rentals for reservation ${reservation.Reservation_ID}:`, error);
      }
    }

    // Build sales report data - one entry per transaction
    const reportData = [];
    let totalReservations = 0; // Count transactions, not individual reservations
    let totalIncome = 0;
    let totalCancellations = 0;

    console.log(`[SalesReport] Grouped ${reservations.length} reservations into ${transactionMap.size} transactions`);

    // Convert map to array and sort by date (most recent first)
    const sortedTransactions = Array.from(transactionMap.entries()).sort((a, b) => {
      const dateA = new Date(a[1].date).getTime();
      const dateB = new Date(b[1].date).getTime();
      return dateB - dateA; // Most recent first
    });

    for (const [transactionKey, transaction] of sortedTransactions) {
      // CRITICAL FIX: Include ALL transactions created today, even if they don't have completed payments yet
      // This ensures reservations created at 8am-10am are included even if payment isn't completed
      // We'll use Total_Amount from reservation if payment amount is not available
      if (!transaction.payment) {
        console.log(`[SalesReport] Transaction ${transactionKey} has no completed payment, but including it (using Total_Amount from reservations)`);
        // Don't skip - include it with reservation Total_Amount
      }
      
      // IMPORTANT: Include ALL transactions created in the date range, regardless of:
      // - Whether the reservation period (Reservation_Date + End_Time) has ended
      // - Payment status (include even if payment isn't completed yet)
      // - Reservation status (Cancelled reservations are still included, just marked as cancelled)
      // Sales report shows all sales created today until the day is finished
      
      // Count each transaction as 1 reservation (not individual courts)
      totalReservations += 1;
      totalIncome += transaction.totalAmount;
      
      if (transaction.isCancelled) {
        totalCancellations += 1; // Count cancelled transactions, not individual reservations
      }

      // Combine all courts and times for display (preserve order and show all)
      const courtsDisplay = transaction.courts.join(', ');
      const timesDisplay = transaction.times.join(', ');

      console.log(`[SalesReport] Transaction ${transactionKey}: ${transaction.reservations.length} reservations, Customer: ${transaction.customerName}, Courts: ${courtsDisplay}, Times: ${timesDisplay}, Total: ${transaction.totalAmount}`);

      // Use reservation date (not payment date) for the report entry
      // This ensures the date shown matches the date filter
      const reportDate = transaction.reservations[0]?.Reservation_Date 
        ? formatDate(transaction.reservations[0].Reservation_Date)
        : formatDate(transaction.date);
      
      reportData.push({
        reservationId: transaction.reservations[0].Reservation_ID, // Use first reservation ID as identifier
        customerName: transaction.customerName,
        courtName: courtsDisplay, // Show all courts in the transaction
        time: timesDisplay, // Show all time slots in the transaction
        date: reportDate, // Use reservation date, not payment date
        paymentMethod: transaction.paymentMethod,
        price: transaction.totalAmount, // Total amount for the entire transaction (sum of individual reservation prices)
        status: transaction.isCancelled ? 'cancelled' : 'completed',
        equipmentRentals: transaction.equipmentRentals,
      });
    }

    console.log(`[SalesReport] Final report: ${reportData.length} transactions, ${totalReservations} total reservations, ${totalIncome} total income`);

    return {
      data: reportData,
      summary: {
        totalReservations,
        totalIncome,
        totalCancellations,
      },
    };
  }

  async debugReservationsData(startDate: Date, endDate: Date) {
    try {
      // Fetch all reservations with relations (same as getSalesReport)
      const allReservations = await this.reservationsRepository.find({
        relations: ['user', 'court', 'payments'],
        order: { Created_at: 'DESC' },
        take: 50, // Limit to last 50 for debugging
      });

      // Filter by Created_at for date range
      const dateRangeReservations = allReservations.filter(reservation => {
        const createdDate = new Date(reservation.Created_at);
        createdDate.setHours(0, 0, 0, 0);
        const normalizedStartDate = new Date(startDate);
        normalizedStartDate.setHours(0, 0, 0, 0);
        const normalizedEndDate = new Date(endDate);
        normalizedEndDate.setHours(23, 59, 59, 999);
        return createdDate >= normalizedStartDate && createdDate <= normalizedEndDate;
      });

      // Get reservations with completed payments
      const withCompletedPayments = allReservations.filter(reservation => {
        return reservation.payments && reservation.payments.some(
          (payment: Payment) => payment.status === PaymentStatus.COMPLETED
        );
      });

      return {
        allReservations: allReservations.map((r: any) => ({
          id: r.Reservation_ID,
          created_at: r.Created_at,
          created_at_iso: new Date(r.Created_at).toISOString(),
          reservation_date: r.Reservation_Date,
          reservation_date_iso: new Date(r.Reservation_Date).toISOString(),
          reference_number: r.Reference_Number,
          paymongo_reference: r.Paymongo_Reference_Number,
          status: r.Status,
          total_amount: r.Total_Amount,
          has_payment: r.payments && r.payments.length > 0,
          payment_status: r.payments?.map((p: any) => p.status).join(', ') || 'none',
          user: r.user?.name || 'Unknown',
          court: r.court?.Court_Name || 'Unknown',
        })),
        dateRangeReservations: dateRangeReservations.map((r: any) => ({
          id: r.Reservation_ID,
          created_at: r.Created_at,
          created_at_iso: new Date(r.Created_at).toISOString(),
          reservation_date: r.Reservation_Date,
          reservation_date_iso: new Date(r.Reservation_Date).toISOString(),
          reference_number: r.Reference_Number,
          paymongo_reference: r.Paymongo_Reference_Number,
          status: r.Status,
          total_amount: r.Total_Amount,
          has_payment: r.payments && r.payments.length > 0,
          payment_status: r.payments?.map((p: any) => p.status).join(', ') || 'none',
          user: r.user?.name || 'Unknown',
          court: r.court?.Court_Name || 'Unknown',
        })),
        summary: {
          totalReservations: allReservations.length,
          dateRangeReservations: dateRangeReservations.length,
          withCompletedPayments: withCompletedPayments.length,
        },
      };
    } catch (error) {
      console.error('[PaymentsService] Error in debugReservationsData:', error);
      throw error;
    }
  }
}
