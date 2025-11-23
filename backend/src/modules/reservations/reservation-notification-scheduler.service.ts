import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Reservation, ReservationStatus } from './entities/reservation.entity';

@Injectable()
export class ReservationNotificationSchedulerService {
  private readonly logger = new Logger(ReservationNotificationSchedulerService.name);
  private readonly notificationSentCache = new Set<string>(); // Track sent notifications to avoid duplicates

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Runs every 5 minutes to check for reservations starting in 30 minutes
   * Sends reminder notifications to customers
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async handleReservationReminders() {
    this.logger.log('Checking for reservations starting in 30 minutes...');

    try {
      const now = new Date();
      
      // Format today's date as YYYY-MM-DD for comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Find all confirmed reservations (we'll filter by date in code)
      const allReservations = await this.reservationsRepository.find({
        where: {
          Status: ReservationStatus.CONFIRMED,
        },
        relations: ['user', 'court'],
      });

      // Filter reservations for today only
      const reservations = allReservations.filter((res) => {
        const resDate = new Date(res.Reservation_Date);
        const resDateString = `${resDate.getFullYear()}-${String(resDate.getMonth() + 1).padStart(2, '0')}-${String(resDate.getDate()).padStart(2, '0')}`;
        return resDateString === todayString;
      });

      let reminderCount = 0;

      for (const reservation of reservations) {
        if (!reservation.user || !reservation.court) {
          continue;
        }

        // Parse reservation date and start time
        const reservationDate = new Date(reservation.Reservation_Date);
        const [hours, minutes] = reservation.Start_Time.split(':').map(Number);
        const reservationStartTime = new Date(reservationDate);
        reservationStartTime.setHours(hours, minutes, 0, 0);

        // Check if reservation starts in approximately 30 minutes (within 5 minute window)
        const timeDiff = reservationStartTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        if (minutesDiff >= 25 && minutesDiff <= 35) {
          // Create unique key for this notification
          const notificationKey = `reminder-${reservation.Reservation_ID}-${Math.floor(minutesDiff)}`;
          
          // Check if we already sent this notification
          if (this.notificationSentCache.has(notificationKey)) {
            continue;
          }

          // Send reminder notification
          await this.sendReminderNotification(reservation);
          this.notificationSentCache.add(notificationKey);
          reminderCount++;

          this.logger.log(
            `Sent reminder notification for reservation ${reservation.Reservation_ID} (starts in ${Math.round(minutesDiff)} minutes)`,
          );
        }
      }

      if (reminderCount > 0) {
        this.logger.log(`Sent ${reminderCount} reminder notification(s)`);
      }
    } catch (error) {
      this.logger.error('Error checking for reservation reminders:', error);
    }
  }

  /**
   * Runs every 5 minutes to check for reservations that just ended
   * Sends completion notifications to customers
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async handleReservationEnded() {
    this.logger.log('Checking for reservations that just ended...');

    try {
      const now = new Date();
      
      // Format today's date as YYYY-MM-DD for comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Find all confirmed reservations (we'll filter by date in code)
      const allReservations = await this.reservationsRepository.find({
        where: {
          Status: ReservationStatus.CONFIRMED,
        },
        relations: ['user', 'court'],
      });

      // Filter reservations for today only
      const reservations = allReservations.filter((res) => {
        const resDate = new Date(res.Reservation_Date);
        const resDateString = `${resDate.getFullYear()}-${String(resDate.getMonth() + 1).padStart(2, '0')}-${String(resDate.getDate()).padStart(2, '0')}`;
        return resDateString === todayString;
      });

      let endedCount = 0;

      for (const reservation of reservations) {
        if (!reservation.user || !reservation.court) {
          continue;
        }

        // Parse reservation date and end time
        const reservationDate = new Date(reservation.Reservation_Date);
        const [hours, minutes] = reservation.End_Time.split(':').map(Number);
        const reservationEndTime = new Date(reservationDate);
        reservationEndTime.setHours(hours, minutes, 0, 0);

        // Check if reservation ended within the last 5 minutes
        const timeDiff = now.getTime() - reservationEndTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        if (minutesDiff >= 0 && minutesDiff <= 5) {
          // Create unique key for this notification
          const notificationKey = `ended-${reservation.Reservation_ID}-${Math.floor(minutesDiff)}`;
          
          // Check if we already sent this notification
          if (this.notificationSentCache.has(notificationKey)) {
            continue;
          }

          // Send ended notification
          await this.sendEndedNotification(reservation);
          this.notificationSentCache.add(notificationKey);
          endedCount++;

          this.logger.log(
            `Sent ended notification for reservation ${reservation.Reservation_ID} (ended ${Math.round(minutesDiff)} minutes ago)`,
          );
        }
      }

      if (endedCount > 0) {
        this.logger.log(`Sent ${endedCount} ended notification(s)`);
      }
    } catch (error) {
      this.logger.error('Error checking for ended reservations:', error);
    }
  }

  /**
   * Send reminder notification 30 minutes before reservation
   */
  private async sendReminderNotification(reservation: Reservation) {
    try {
      const reservationDate = new Date(reservation.Reservation_Date);
      const [startHours, startMinutes] = reservation.Start_Time.split(':').map(Number);
      const [endHours, endMinutes] = reservation.End_Time.split(':').map(Number);

      const startTime = new Date(reservationDate);
      startTime.setHours(startHours, startMinutes, 0, 0);
      
      const endTime = new Date(reservationDate);
      endTime.setHours(endHours, endMinutes, 0, 0);

      const formattedDate = reservationDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const formattedStartTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const formattedEndTime = endTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      await this.mailerService.sendMail({
        to: reservation.user.email,
        subject: `Reminder: Your Reservation Starts in 30 Minutes - ${reservation.court.Court_Name}`,
        template: 'reservation-reminder',
        context: {
          customerName: reservation.user.name || reservation.user.username,
          courtName: reservation.court.Court_Name,
          reservationDate: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          referenceNumber: reservation.Reference_Number || `#${reservation.Reservation_ID}`,
          appName: this.configService.get('APP_NAME', 'Budz Reserve'),
          appUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
          supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@budzreserve.com'),
        },
      });

      this.logger.log(`Reminder notification sent to ${reservation.user.email} for reservation ${reservation.Reservation_ID}`);
    } catch (error) {
      this.logger.error(`Failed to send reminder notification for reservation ${reservation.Reservation_ID}:`, error);
    }
  }

  /**
   * Send notification after reservation period ends
   */
  private async sendEndedNotification(reservation: Reservation) {
    try {
      const reservationDate = new Date(reservation.Reservation_Date);
      const [startHours, startMinutes] = reservation.Start_Time.split(':').map(Number);
      const [endHours, endMinutes] = reservation.End_Time.split(':').map(Number);

      const startTime = new Date(reservationDate);
      startTime.setHours(startHours, startMinutes, 0, 0);
      
      const endTime = new Date(reservationDate);
      endTime.setHours(endHours, endMinutes, 0, 0);

      const formattedDate = reservationDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const formattedStartTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const formattedEndTime = endTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      await this.mailerService.sendMail({
        to: reservation.user.email,
        subject: `Thank You for Your Reservation - ${reservation.court.Court_Name}`,
        template: 'reservation-ended',
        context: {
          customerName: reservation.user.name || reservation.user.username,
          courtName: reservation.court.Court_Name,
          reservationDate: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          referenceNumber: reservation.Reference_Number || `#${reservation.Reservation_ID}`,
          appName: this.configService.get('APP_NAME', 'Budz Reserve'),
          appUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
          supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@budzreserve.com'),
        },
      });

      this.logger.log(`Ended notification sent to ${reservation.user.email} for reservation ${reservation.Reservation_ID}`);
    } catch (error) {
      this.logger.error(`Failed to send ended notification for reservation ${reservation.Reservation_ID}:`, error);
    }
  }

  /**
   * Clear old notification cache entries (runs daily at midnight)
   * This prevents memory from growing indefinitely
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearNotificationCache() {
    this.logger.log('Clearing notification cache...');
    this.notificationSentCache.clear();
    this.logger.log('Notification cache cleared');
  }
}

