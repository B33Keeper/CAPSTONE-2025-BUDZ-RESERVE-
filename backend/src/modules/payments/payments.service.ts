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
    console.log(`[SalesReport Service] Fetching sales report between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    
    // Fetch all reservations with their relations (same approach as my-reservations endpoint)
    // This matches how ReservationsService.findByUser() fetches data
    let reservations;
    try {
      console.log(`[SalesReport Service] Querying all reservations with relations...`);
      reservations = await this.reservationsRepository.find({
        relations: ['user', 'court', 'payments'],
        order: { Created_at: 'DESC' },
      });
      console.log(`[SalesReport Service] Found ${reservations.length} total reservations`);
      
      // Step 1: Find all reservations with completed payments in date range
      const reservationsWithPayments = reservations.filter(reservation => {
        const hasCompletedPayment = reservation.payments && reservation.payments.some(
          (payment: Payment) => payment.status === PaymentStatus.COMPLETED
        );
        
        if (!hasCompletedPayment) return false;
        
        const completedPayment = reservation.payments.find(
          (payment: Payment) => payment.status === PaymentStatus.COMPLETED
        );
        
        if (completedPayment) {
          const paymentDate = new Date(completedPayment.created_at);
          return paymentDate >= startDate && paymentDate <= endDate;
        }
        
        return false;
      });
      
      console.log(`[SalesReport Service] Found ${reservationsWithPayments.length} reservations with completed payments in date range`);
      
      // Step 2: Collect all Reference_Number and Paymongo_Reference_Number from these reservations
      const transactionReferenceNumbers = new Set<string>();
      reservationsWithPayments.forEach(reservation => {
        if (reservation.Reference_Number) {
          transactionReferenceNumbers.add(reservation.Reference_Number);
        }
        if (reservation.Paymongo_Reference_Number) {
          transactionReferenceNumbers.add(reservation.Paymongo_Reference_Number);
        }
      });
      
      console.log(`[SalesReport Service] Found ${transactionReferenceNumbers.size} unique transaction reference numbers`);
      
      // Step 3: Include ALL reservations that share the same Reference_Number or Paymongo_Reference_Number
      // This ensures we get all reservations from the same transaction, even if they don't have payments linked
      const seenReservationIds = new Set<number>();
      const filteredReservations = reservations.filter(reservation => {
        // Skip if we've already processed this reservation ID (avoid duplicates)
        if (seenReservationIds.has(reservation.Reservation_ID)) {
          return false;
        }
        
        // Include if it has a matching reference number (same transaction)
        const matchesReference = reservation.Reference_Number && transactionReferenceNumbers.has(reservation.Reference_Number);
        const matchesPaymongoRef = reservation.Paymongo_Reference_Number && transactionReferenceNumbers.has(reservation.Paymongo_Reference_Number);
        
        if (matchesReference || matchesPaymongoRef) {
          seenReservationIds.add(reservation.Reservation_ID);
          return true;
        }
        
        return false;
      });
      
      reservations = filteredReservations;
      console.log(`[SalesReport Service] Expanded to ${reservations.length} total reservations (including all from same transactions)`);
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

    // Group reservations by transaction
    // IMPORTANT: All reservations from the same transaction share the same Reference_Number and Paymongo_Reference_Number
    // We need to group them first, then find the payment for the group
    for (const reservation of reservations) {
      // PRIMARY GROUPING: Use Reference_Number or Paymongo_Reference_Number
      // All reservations created from the same PayMongo payment share these values
      let transactionKey = reservation.Reference_Number || reservation.Paymongo_Reference_Number;
      
      // FALLBACK: If no reference numbers, try to use payment transaction_id
      // But first check if reservation has a payment
      const completedPayment = reservation.payments?.find(
        (payment: Payment) => payment.status === PaymentStatus.COMPLETED
      );
      
      if (!transactionKey && completedPayment?.transaction_id) {
        transactionKey = completedPayment.transaction_id;
      }
      
      // FALLBACK: Last resort - unique key per reservation (shouldn't happen)
      if (!transactionKey) {
        transactionKey = `${reservation.Reservation_Date}_${reservation.Start_Time}_${reservation.End_Time}_${reservation.Reservation_ID}`;
      }
      
      // Skip if no completed payment (but log it for debugging)
      if (!completedPayment) {
        console.log(`[SalesReport] WARNING: Reservation ${reservation.Reservation_ID} has no completed payment but will still be grouped by transactionKey=${transactionKey}`);
        // Continue to include it in the group, we'll find the payment from another reservation in the same group
      }
      
      console.log(`[SalesReport] Processing reservation ${reservation.Reservation_ID}: Reference_Number=${reservation.Reference_Number}, Paymongo_Reference_Number=${reservation.Paymongo_Reference_Number}, PaymentTransactionID=${completedPayment?.transaction_id}, TransactionKey=${transactionKey}`);
      
      if (!transactionMap.has(transactionKey)) {
        // Create new transaction group
        // Use the payment from this reservation, or we'll find one from another reservation in the group
        console.log(`[SalesReport] Creating new transaction group: ${transactionKey}`);
        transactionMap.set(transactionKey, {
          reservations: [],
          payment: completedPayment || null, // May be null initially, will be set from first reservation with payment
          customerName: reservation.user?.name || 'Unknown',
          date: completedPayment?.created_at || reservation.Reservation_Date,
          paymentMethod: completedPayment?.payment_method || 'Unknown',
          totalAmount: 0,
          equipmentRentals: [],
          courts: [],
          times: [],
          isCancelled: false,
        });
      }

      const transaction = transactionMap.get(transactionKey)!;
      
      // Update payment info if this reservation has a payment and the group doesn't have one yet
      if (!transaction.payment && completedPayment) {
        transaction.payment = completedPayment;
        transaction.date = completedPayment.created_at || reservation.Reservation_Date;
        transaction.paymentMethod = completedPayment.payment_method || 'Unknown';
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

      // Add individual reservation amount to total
      const reservationAmount = Number(reservation.Total_Amount) || 0;
      const finalAmount = reservationAmount > 0 ? reservationAmount : (completedPayment ? Number(completedPayment.amount) || 0 : 0);
      transaction.totalAmount += finalAmount;
      
      console.log(`[SalesReport] Transaction ${transactionKey}: Added reservation ${reservation.Reservation_ID} - Court: ${courtName}, Time: ${timeStr}, Amount: ${finalAmount}, Total so far: ${transaction.totalAmount}`);

      // Check if any reservation is cancelled
      if (reservation.Status === 'Cancelled') {
        transaction.isCancelled = true;
      }

      // Fetch equipment rentals for this reservation
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
      // Skip transactions without payments (they shouldn't be in the sales report)
      if (!transaction.payment) {
        console.log(`[SalesReport] WARNING: Transaction ${transactionKey} has no payment, skipping from report`);
        continue;
      }
      
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

      reportData.push({
        reservationId: transaction.reservations[0].Reservation_ID, // Use first reservation ID as identifier
        customerName: transaction.customerName,
        courtName: courtsDisplay, // Show all courts in the transaction
        time: timesDisplay, // Show all time slots in the transaction
        date: formatDate(transaction.date),
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
}
