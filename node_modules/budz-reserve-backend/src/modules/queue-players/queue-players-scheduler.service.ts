import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { QueuePlayer } from './entities/queue-player.entity';

@Injectable()
export class QueuePlayersSchedulerService {
  private readonly logger = new Logger(QueuePlayersSchedulerService.name);

  constructor(
    @InjectRepository(QueuePlayer)
    private readonly queuePlayersRepository: Repository<QueuePlayer>,
  ) {}

  /**
   * Runs daily at midnight (00:00) to clean up old players
   * This ensures players from previous days are properly archived
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyPlayerCleanup() {
    this.logger.log('Starting daily player cleanup task...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all players with lastPlayed before today
      const oldPlayers = await this.queuePlayersRepository.find({
        where: {
          lastPlayed: LessThan(today),
        },
      });

      if (oldPlayers.length > 0) {
        this.logger.log(
          `Found ${oldPlayers.length} player(s) from previous days. These will be available in history.`,
        );

        // Log the players being archived
        oldPlayers.forEach((player) => {
          this.logger.debug(
            `Player "${player.name}" with lastPlayed: ${player.lastPlayed} is now in history`,
          );
        });
      } else {
        this.logger.log('No old players found. All players are current.');
      }

      this.logger.log('Daily player cleanup task completed successfully.');
    } catch (error) {
      this.logger.error('Error during daily player cleanup:', error);
    }
  }

  /**
   * Manual cleanup method that can be called on-demand
   * This can be used for testing or manual triggering
   */
  async manualCleanup(): Promise<{
    message: string;
    oldPlayersCount: number;
    oldPlayers: QueuePlayer[];
  }> {
    this.logger.log('Manual cleanup triggered...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oldPlayers = await this.queuePlayersRepository.find({
      where: {
        lastPlayed: LessThan(today),
      },
    });

    return {
      message: `Found ${oldPlayers.length} player(s) from previous days`,
      oldPlayersCount: oldPlayers.length,
      oldPlayers,
    };
  }

  /**
   * Delete players older than a specified number of days
   * This helps keep the database clean by removing very old records
   */
  async deleteOldPlayers(daysToKeep: number = 30): Promise<number> {
    this.logger.log(`Deleting players older than ${daysToKeep} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    cutoffDate.setHours(0, 0, 0, 0);

    const result = await this.queuePlayersRepository.delete({
      lastPlayed: LessThan(cutoffDate),
    });

    const deletedCount = result.affected || 0;
    this.logger.log(`Deleted ${deletedCount} old player record(s)`);

    return deletedCount;
  }
}


