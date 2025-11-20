import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

@Injectable()
export class EquipmentRentalSchedulerService {
  private readonly logger = new Logger(EquipmentRentalSchedulerService.name);

  constructor(
    @InjectRepository(EquipmentRentalItem)
    private readonly rentalItemRepository: Repository<EquipmentRentalItem>,
    @InjectRepository(EquipmentRental)
    private readonly rentalRepository: Repository<EquipmentRental>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  /**
   * Runs every 5 minutes to check for expired equipment rentals
   * Restores stock for rentals that have passed their expiration time
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async handleExpiredRentalRestoration() {
    this.logger.log('Checking for expired equipment rentals...');

    try {
      const now = new Date();
      let restoredCount = 0;

      // Get all rental items
      const rentalItems = await this.rentalItemRepository.find();

      for (const item of rentalItems) {
        // Get the rental to find the reservation
        const rental = await this.rentalRepository.findOne({
          where: { id: item.rental_id },
        });

        if (!rental || !rental.reservation_id) {
          continue;
        }

        // Get the reservation to calculate expiration
        const reservation = await this.reservationRepository.findOne({
          where: { Reservation_ID: rental.reservation_id },
        });

        if (!reservation) {
          continue;
        }

        // Parse reservation date and start time
        let reservationDate: Date;
        if (reservation.Reservation_Date instanceof Date) {
          reservationDate = new Date(reservation.Reservation_Date);
        } else {
          // If it's a string, parse it
          const dateStr = typeof reservation.Reservation_Date === 'string' 
            ? reservation.Reservation_Date 
            : String(reservation.Reservation_Date);
          reservationDate = new Date(dateStr);
        }

        // Reset time to start of day to avoid timezone issues
        reservationDate.setHours(0, 0, 0, 0);

        const startTime = reservation.Start_Time;
        const hours = item.hours;
        const quantity = item.quantity;
        const equipmentId = item.equipment_id;
        const itemId = item.id;

        // Parse start time and set it to reservation date
        if (startTime) {
          const timeParts = startTime.split(':');
          const timeHours = parseInt(timeParts[0] || '0', 10);
          const timeMinutes = parseInt(timeParts[1] || '0', 10);
          reservationDate.setHours(timeHours, timeMinutes, 0, 0);
        }

        // Calculate expiration: reservation date + start time + rental hours
        const expirationDate = new Date(reservationDate);
        expirationDate.setHours(expirationDate.getHours() + hours);

        // If expired, restore stock
        if (expirationDate < now) {
          // Validate equipment ID before lookup
          if (!equipmentId || equipmentId === 0) {
            this.logger.error(
              `Invalid equipment_id (${equipmentId}) for rental item ID ${itemId}. Skipping restoration.`
            );
            // Delete the invalid rental item
            await this.rentalItemRepository.delete(itemId);
            continue;
          }

          const equipment = await this.equipmentRepository.findOne({
            where: { id: equipmentId },
          });

          if (!equipment) {
            this.logger.error(
              `Equipment with ID ${equipmentId} not found for rental item ID ${itemId}. Skipping restoration.`
            );
            // Delete the rental item with invalid equipment reference
            await this.rentalItemRepository.delete(itemId);
            continue;
          }

          // Restore stock
          const previousStock = equipment.stocks;
          const newStock = previousStock + quantity;
          
          await this.equipmentRepository.update(equipment.id, {
            stocks: newStock,
          });

          // Verify the update
          const updatedEquipment = await this.equipmentRepository.findOne({
            where: { id: equipment.id },
          });

          if (updatedEquipment && updatedEquipment.stocks === newStock) {
            this.logger.log(
              `Restored ${quantity} stock for ${equipment.equipment_name} (ID: ${equipment.id}). ` +
              `Previous: ${previousStock}, New: ${newStock}, Verified: ${updatedEquipment.stocks} ` +
              `(Rental Item ID: ${itemId}, Equipment ID from item: ${equipmentId}, Expired at: ${expirationDate.toISOString()})`
            );
            restoredCount++;
          } else {
            this.logger.error(
              `Failed to restore stock for ${equipment.equipment_name} (ID: ${equipment.id}). ` +
              `Expected: ${newStock}, Actual: ${updatedEquipment?.stocks || 'unknown'} ` +
              `(Rental Item ID: ${itemId}, Equipment ID from item: ${equipmentId})`
            );
          }

          // Delete the expired rental item to avoid processing it again
          await this.rentalItemRepository.delete(itemId);
        }
      }

      if (restoredCount > 0) {
        this.logger.log(`Restored stock for ${restoredCount} expired rental(s)`);
      } else {
        this.logger.debug('No expired rentals found');
      }
    } catch (error) {
      this.logger.error('Error during expired rental restoration:', error);
    }
  }

  /**
   * Manual restoration method that can be called on-demand
   */
  async manualRestoreExpiredRentals(): Promise<{
    message: string;
    restoredCount: number;
  }> {
    this.logger.log('Manual expired rental restoration triggered...');
    
    // Call the same logic
    await this.handleExpiredRentalRestoration();
    
    return {
      message: 'Expired rental restoration completed',
      restoredCount: 0, // Would need to return actual count from the method
    };
  }
}

