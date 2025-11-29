import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationsService } from './reservations.service';

@Injectable()
export class ReservationsSchedulerService {
  private readonly logger = new Logger(ReservationsSchedulerService.name);

  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  /**
   * Runs daily at midnight (00:00) to move ended reservations to history
   * Moves all confirmed reservations that have ended (based on date and end time)
   * 
   * This task automatically transfers completed reservations to the history table
   * to keep the main reservations table organized with only active reservations
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyReservationCleanup() {
    this.logger.log('Starting daily reservation cleanup task...');

    try {
      const result = await this.reservationsService.moveEndedReservationsToHistory();
      
      if (result.count > 0) {
        this.logger.log(
          `Successfully moved ${result.count} ended reservation(s) to history. ` +
          `Reservation IDs: ${result.movedIds.join(', ')}`
        );
      } else {
        this.logger.log('No ended reservations found. All reservations are current.');
      }

      this.logger.log('Daily reservation cleanup task completed successfully.');
    } catch (error) {
      this.logger.error('Error during daily reservation cleanup:', error);
    }
  }

  /**
   * Manual cleanup method that can be called on-demand
   * This can be used for testing or manual triggering
   * Moves reservations to history and returns the results
   */
  async manualCleanup(): Promise<{
    message: string;
    endedReservationsCount: number;
    movedToHistory: number;
    movedIds: number[];
  }> {
    this.logger.log('Manual reservation cleanup triggered...');

    try {
      const endedReservations = await this.reservationsService.getEndedReservations();
      const result = await this.reservationsService.moveEndedReservationsToHistory();

      return {
        message: `Found ${endedReservations.length} ended reservation(s). Successfully moved ${result.count} to history.`,
        endedReservationsCount: endedReservations.length,
        movedToHistory: result.count,
        movedIds: result.movedIds,
      };
    } catch (error) {
      this.logger.error('Error during manual reservation cleanup:', error);
      throw error;
    }
  }
}

