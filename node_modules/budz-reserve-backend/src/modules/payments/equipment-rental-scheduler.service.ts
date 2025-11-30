import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Runs every 5 minutes to check for expired rentals
   * Restores stock and sends email notifications
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredRentals() {
    this.logger.log('Checking for expired equipment rentals...');

    try {
      const now = new Date();
      
      // Find all rental items that have expired (rental_end_time <= now) and stock hasn't been restored
      const expiredRentals = await this.rentalItemRepository.find({
        where: {
          rental_end_time: LessThanOrEqual(now),
          stock_restored: false,
        },
        relations: ['rental'],
      });

      if (expiredRentals.length === 0) {
        this.logger.log('No expired rentals found.');
        return;
      }

      this.logger.log(`Found ${expiredRentals.length} expired rental(s). Processing...`);

      for (const rentalItem of expiredRentals) {
        try {
          // Mark stock as restored (stock is calculated dynamically, so no need to restore in database)
          // This marks the rental as expired so it's no longer counted in available stock calculation
          await this.rentalItemRepository.update(rentalItem.id, {
            stock_restored: true,
          });
          
          const equipment = await this.equipmentRepository.findOne({
            where: { id: rentalItem.equipment_id },
          });
          
          if (equipment) {
            this.logger.log(
              `Marked rental item ${rentalItem.id} as restored for ${equipment.equipment_name}. Stock is now available again.`,
            );
          }

          // Create admin notification if not already sent
          if (!rentalItem.notification_sent) {
            await this.createEquipmentReturnNotification(rentalItem);
            await this.rentalItemRepository.update(rentalItem.id, {
              notification_sent: true,
            });
          }
        } catch (error) {
          this.logger.error(`Error processing expired rental item ${rentalItem.id}:`, error);
        }
      }

      this.logger.log(`Successfully processed ${expiredRentals.length} expired rental(s).`);
    } catch (error) {
      this.logger.error('Error during expired rentals check:', error);
    }
  }

  /**
   * Create admin notification for equipment return reminder
   */
  private async createEquipmentReturnNotification(rentalItem: EquipmentRentalItem) {
    try {
      // Get rental with user information
      const rental = await this.rentalRepository.findOne({
        where: { id: rentalItem.rental_id },
        relations: [],
      });

      if (!rental) {
        this.logger.warn(`Rental ${rentalItem.rental_id} not found for notification`);
        return;
      }

      // Get user information
      const user = await this.userRepository.findOne({
        where: { id: rental.user_id },
      });

      if (!user) {
        this.logger.warn(`User ${rental.user_id} not found for notification`);
        return;
      }

      // Get equipment information
      const equipment = await this.equipmentRepository.findOne({
        where: { id: rentalItem.equipment_id },
      });

      if (!equipment) {
        this.logger.warn(`Equipment ${rentalItem.equipment_id} not found for notification`);
        return;
      }

      // Format rental end time
      const endTime = rentalItem.rental_end_time
        ? new Date(rentalItem.rental_end_time).toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'N/A';

      // Create notification for admin
      const userName = user.name || user.username;
      const title = `Equipment Return Reminder - ${equipment.equipment_name}`;
      const message = `${userName} needs to return ${rentalItem.quantity} ${equipment.equipment_name}(s). Rental period ended on ${endTime}.`;

      await this.notificationsService.create({
        type: NotificationType.EQUIPMENT_RENTAL_EXPIRED,
        title,
        message,
        equipment_rental_item_id: rentalItem.id,
        user_id: rental.user_id,
      });

      this.logger.log(
        `Equipment return notification created successfully for rental item ${rentalItem.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to create equipment return notification for rental item ${rentalItem.id}:`, error);
    }
  }

  /**
   * Manual method to check and process expired rentals (for testing)
   */
  async manualCheckExpiredRentals() {
    this.logger.log('Manual check for expired rentals triggered...');
    
    const now = new Date();
    const expiredRentals = await this.rentalItemRepository.find({
      where: {
        rental_end_time: LessThanOrEqual(now),
        stock_restored: false,
      },
      relations: ['rental'],
    });

    let processedCount = 0;
    let emailSentCount = 0;
    const processedItems: any[] = [];

    if (expiredRentals.length > 0) {
      for (const rentalItem of expiredRentals) {
        try {
          // Mark stock as restored
          await this.rentalItemRepository.update(rentalItem.id, {
            stock_restored: true,
          });
          
          const equipment = await this.equipmentRepository.findOne({
            where: { id: rentalItem.equipment_id },
          });

          // Create admin notification if not already sent
          let notificationCreated = false;
          if (!rentalItem.notification_sent) {
            try {
              await this.createEquipmentReturnNotification(rentalItem);
              await this.rentalItemRepository.update(rentalItem.id, {
                notification_sent: true,
              });
              notificationCreated = true;
              emailSentCount++;
            } catch (notificationError) {
              this.logger.error(`Failed to create notification for rental item ${rentalItem.id}:`, notificationError);
            }
          }

          processedItems.push({
            rentalItemId: rentalItem.id,
            equipmentId: rentalItem.equipment_id,
            equipmentName: equipment?.equipment_name || 'Unknown',
            quantity: rentalItem.quantity,
            rentalEndTime: rentalItem.rental_end_time,
            notificationCreated,
          });
          processedCount++;
        } catch (error) {
          this.logger.error(`Error processing expired rental item ${rentalItem.id}:`, error);
        }
      }
    }

    return {
      message: expiredRentals.length > 0
        ? `Found and processed ${expiredRentals.length} expired rental(s). ${emailSentCount} notification(s) created.`
        : 'No expired rentals found.',
      expiredRentalsFound: expiredRentals.length,
      processedCount,
      notificationCount: emailSentCount,
      processedItems,
    };
  }
}

