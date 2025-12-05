import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, LessThan } from 'typeorm';
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

  async getSalesReport(startDate: Date, endDate: Date, period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'daily') {
    console.log(`[SalesReport Service] Fetching sales report between ${startDate.toISOString()} and ${endDate.toISOString()} for period: ${period}`);
    
    // Create new date objects to avoid mutating the original dates
    const queryStartDate = new Date(startDate);
    const queryEndDate = new Date(endDate);
    
    // Determine which date field to filter by based on period
    // Daily: Filter by Created_at (when reservation was created) - resets every day at midnight
    // Weekly/Monthly/Quarterly/Yearly: Filter by Reservation_Date (actual reservation date) - follows period range
    const useCreatedAt = period === 'daily';
    const dateField = useCreatedAt ? 'Created_at' : 'Reservation_Date';
    
    // For daily reports, ensure we capture the full day (12:00 AM to 11:59:59 PM)
    // Calculate next day's start time for exclusive upper bound
    // This ensures we capture ALL records from 12:00:00.000 AM to 11:59:59.999 PM
    const nextDayStart = new Date(queryEndDate);
    nextDayStart.setDate(nextDayStart.getDate() + 1);
    nextDayStart.setHours(0, 0, 0, 0);
    
    // For non-daily periods, use inclusive end date (end of the period)
    // For daily, use exclusive upper bound (next day start)
    const useExclusiveEnd = period === 'daily';
    const endDateForQuery = useExclusiveEnd ? nextDayStart : queryEndDate;
    const endDateOperator = useExclusiveEnd ? '<' : '<=';
    
    // Log the dates for debugging
    console.log(`[SalesReport Service] Query dates - Start: ${queryStartDate.toISOString()} (Local: ${queryStartDate.toLocaleString()}), End: ${queryEndDate.toISOString()} (Local: ${queryEndDate.toLocaleString()})`);
    console.log(`[SalesReport Service] Filtering by ${dateField} (${useCreatedAt ? 'Created_at - resets daily' : 'Reservation_Date - follows period range'})`);
    console.log(`[SalesReport Service] Query range: ${dateField} >= ${queryStartDate.toISOString()} AND ${dateField} ${endDateOperator} ${endDateForQuery.toISOString()}`);
    
    // Use database WHERE clause instead of fetching all and filtering in JavaScript
    // This is MUCH faster, especially with large datasets
    // Use MoreThanOrEqual and LessThan/LessThanOrEqual to ensure we capture the full range
    let reservations;
    try {
      console.log(`[SalesReport Service] Querying reservations with date filter at database level...`);
      
      // Use query builder for more explicit control over the date range
      // This ensures we capture ALL reservations in the specified period
      // For Reservation_Date (date type), we need to compare date-only values
      // For Created_at (datetime type), we compare full datetime values
      const queryBuilder = this.reservationsRepository
        .createQueryBuilder('reservation');
      
      if (useCreatedAt) {
        // Created_at is datetime - compare full datetime
        queryBuilder.where(`reservation.Created_at >= :startDate`, { startDate: queryStartDate });
        if (useExclusiveEnd) {
          queryBuilder.andWhere(`reservation.Created_at < :endDate`, { endDate: endDateForQuery });
        } else {
          queryBuilder.andWhere(`reservation.Created_at <= :endDate`, { endDate: endDateForQuery });
        }
        queryBuilder.orderBy('reservation.Created_at', 'DESC');
      } else {
        // Reservation_Date is DATE type (date-only, no time)
        // Format dates directly to avoid timezone conversion issues
        // toISOString() converts to UTC which can shift the date by a day
        const formatDateString = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const startDateStr = formatDateString(queryStartDate);
        const endDateStr = formatDateString(queryEndDate);
        
        console.log(`[SalesReport Service] DATE comparison - Start: ${startDateStr}, End: ${endDateStr}`);
        console.log(`[SalesReport Service] Original query dates - Start: ${queryStartDate.toISOString()} (Local: ${queryStartDate.toLocaleDateString()}), End: ${queryEndDate.toISOString()} (Local: ${queryEndDate.toLocaleDateString()})`);
        
        // Use Between operator for DATE field - TypeORM handles DATE type comparisons correctly
        // Between is inclusive on both ends (>= start AND <= end)
        queryBuilder.where('reservation.Reservation_Date BETWEEN :startDate AND :endDate', { 
          startDate: startDateStr, // YYYY-MM-DD format (no timezone conversion)
          endDate: endDateStr // YYYY-MM-DD format (no timezone conversion)
        });
        queryBuilder.orderBy('reservation.Reservation_Date', 'DESC');
      }
      
      reservations = await queryBuilder
        .leftJoinAndSelect('reservation.user', 'user')
        .leftJoinAndSelect('reservation.court', 'court')
        .leftJoinAndSelect('reservation.payments', 'payments')
        .getMany();
      
      console.log(`[SalesReport Service] Found ${reservations.length} reservations in date range (filtered by ${dateField})`);
      
      // Debug: Log first few reservation dates to verify they're in range
      if (reservations.length > 0) {
        console.log(`[SalesReport Service] Sample reservation dates:`);
        reservations.slice(0, 3).forEach((res, idx) => {
          const dateValue = useCreatedAt ? res.Created_at : res.Reservation_Date;
          console.log(`  ${idx + 1}. Reservation ${res.Reservation_ID}: ${dateField} = ${dateValue?.toISOString()} (Local: ${dateValue?.toLocaleString()})`);
        });
      } else {
        console.log(`[SalesReport Service] No reservations found. Running debug queries...`);
        
        // Debug 1: Check current date and time
        const now = new Date();
        console.log(`[SalesReport Service] Debug - Current server time: ${now.toISOString()} (Local: ${now.toLocaleString()})`);
        
        // Debug 2: Check what date range we're querying
        console.log(`[SalesReport Service] Debug - Query range: ${queryStartDate.toISOString()} to ${queryEndDate.toISOString()}`);
        console.log(`[SalesReport Service] Debug - Query range local: ${queryStartDate.toLocaleString()} to ${queryEndDate.toLocaleString()}`);
        console.log(`[SalesReport Service] Debug - Filtering by: ${dateField}`);
        
        // Debug 3: Get ALL recent reservations (last 7 days) to see what dates exist
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentReservations = await this.reservationsRepository.find({
          where: useCreatedAt 
            ? { Created_at: MoreThanOrEqual(sevenDaysAgo) }
            : { Reservation_Date: MoreThanOrEqual(sevenDaysAgo) },
          select: ['Reservation_ID', 'Created_at', 'Reservation_Date'],
          order: useCreatedAt ? { Created_at: 'DESC' } : { Reservation_Date: 'DESC' },
          take: 10,
        });
        console.log(`[SalesReport Service] Debug: Found ${recentReservations.length} reservations in last 7 days (by ${dateField}):`);
        recentReservations.forEach((res, idx) => {
          const dateValue = useCreatedAt ? res.Created_at : res.Reservation_Date;
          console.log(`  ${idx + 1}. Reservation ${res.Reservation_ID}: ${dateField} = ${dateValue?.toISOString()} (Local: ${dateValue?.toLocaleString()})`);
        });
        
        // Debug 4: Check if query dates match any reservation dates
        if (recentReservations.length > 0) {
          const queryDateStr = queryStartDate.toISOString().split('T')[0];
          const matchingReservations = recentReservations.filter(res => {
            const dateValue = useCreatedAt ? res.Created_at : res.Reservation_Date;
            const resDateStr = dateValue?.toISOString().split('T')[0];
            return resDateStr === queryDateStr;
          });
          console.log(`[SalesReport Service] Debug: ${matchingReservations.length} reservations match query date (${queryDateStr})`);
        }
      }
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
      created_at: Date | null;
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
          customerName: reservation.user?.name || 'admin', // Default to 'admin' for admin-created reservations
          date: reservation.Reservation_Date,
          created_at: reservation.Created_at || new Date(), // Store creation date for sorting
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
      
      // Update created_at to the most recent Created_at among all reservations in the transaction
      // This ensures "newest first" sorting works correctly
      if (reservation.Created_at) {
        const reservationCreatedAt = new Date(reservation.Created_at);
        const currentCreatedAt = transaction.created_at ? new Date(transaction.created_at) : new Date(0);
        if (reservationCreatedAt > currentCreatedAt) {
          transaction.created_at = reservation.Created_at;
        }
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

      // Note: We'll calculate the transaction total AFTER all reservations are added
      // This is done in a second pass to avoid double-counting

      // Note: Cancelled reservations are already filtered out at the start of the loop,
      // so we don't need to check for cancelled status here
      
      // Equipment rentals will be fetched and added to total AFTER all reservations are grouped
    }

    // CRITICAL FIX: Calculate transaction totals AFTER all reservations are grouped
    // This prevents double-counting when payment is linked to only one reservation but transaction has multiple
    for (const [transactionKey, transaction] of transactionMap.entries()) {
      // Calculate total amount for this transaction
      // Priority: 1. Use payment amount if found, 2. Sum Total_Amount from all reservations
      
      // Check if any reservation in the transaction has a payment
      let transactionPaymentAmount = 0;
      const allPaymentsInTransaction = new Set<string>(); // Track unique transaction_ids
      
      for (const res of transaction.reservations) {
        if (res.payments && Array.isArray(res.payments)) {
          res.payments.forEach((payment: any) => {
            const transactionId = payment?.transaction_id || `unique_${payment?.id || Date.now()}`;
            if (!allPaymentsInTransaction.has(transactionId)) {
              allPaymentsInTransaction.add(transactionId);
              transactionPaymentAmount += Number(payment?.amount ?? 0);
            }
          });
        }
      }
      
      if (transactionPaymentAmount > 0) {
        // Use payment amount for the entire transaction (ONE payment covers all reservations)
        transaction.totalAmount = transactionPaymentAmount;
        console.log(`[SalesReport] Transaction ${transactionKey}: Using payment amount ${transactionPaymentAmount} for entire transaction (${transaction.reservations.length} reservations)`);
      } else {
        // No payments found - sum Total_Amount from all reservations
        transaction.totalAmount = transaction.reservations.reduce((sum: number, res: any) => {
          return sum + (Number(res.Total_Amount) || 0);
        }, 0);
        console.log(`[SalesReport] Transaction ${transactionKey}: No payments found, using sum of Total_Amount from ${transaction.reservations.length} reservations: ${transaction.totalAmount}`);
      }
      
      // Add equipment rental amounts (sum from all reservations in transaction)
      let totalEquipmentRentalAmount = 0;
      for (const res of transaction.reservations) {
        try {
          const rental = await this.equipmentRentalRepository.findOne({
            where: { reservation_id: res.Reservation_ID },
            relations: ['items'],
          });
          
          if (rental) {
            const rentalTotalAmount = Number(rental.total_amount) || 0;
            totalEquipmentRentalAmount += rentalTotalAmount;
            
            // Also collect equipment items for display
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
          console.error(`[SalesReport Service] Error fetching equipment rental for reservation ${res.Reservation_ID}:`, error);
        }
      }
      
      if (totalEquipmentRentalAmount > 0) {
        transaction.totalAmount += totalEquipmentRentalAmount;
        console.log(`[SalesReport] Transaction ${transactionKey}: Added equipment rental total ${totalEquipmentRentalAmount}, Final total: ${transaction.totalAmount}`);
      }
    }

    // Build sales report data - one entry per transaction
    const reportData = [];
    let totalReservations = 0; // Count transactions, not individual reservations
    let totalIncome = 0;
    let totalCancellations = 0;

    console.log(`[SalesReport] Grouped ${reservations.length} reservations into ${transactionMap.size} transactions`);

    // Convert map to array and sort by created_at (most recent first)
    // This ensures newest reservations appear at the top
    const sortedTransactions = Array.from(transactionMap.entries()).sort((a, b) => {
      const createdA = a[1].created_at ? new Date(a[1].created_at).getTime() : 0;
      const createdB = b[1].created_at ? new Date(b[1].created_at).getTime() : 0;
      return createdB - createdA; // Most recent first (newest at top)
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

