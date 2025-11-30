import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository, Or, IsNull } from 'typeorm';
import { QueuePlayer } from './entities/queue-player.entity';
import { QueuePlayerHistory } from './entities/queue-player-history.entity';

@Injectable()
export class QueuePlayersSchedulerService {
  private readonly logger = new Logger(QueuePlayersSchedulerService.name);

  constructor(
    @InjectRepository(QueuePlayer)
    private readonly queuePlayersRepository: Repository<QueuePlayer>,
    @InjectRepository(QueuePlayerHistory)
    private readonly queuePlayersHistoryRepository: Repository<QueuePlayerHistory>,
  ) {}

  /**
   * Runs daily at midnight (00:00) to move players to history
   * Moves all players with lastPlayed before today to the history table
   * Also deletes history records older than 30 days to maintain history limit
   * 
   * DISABLED: Automatic transfer is disabled. Use savePlayersToHistory() manually instead.
   */
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyPlayerCleanup() {
    this.logger.log('Starting daily player cleanup task...');

    try {
      // Get today's date in local timezone (date only, no time component)
      // This ensures consistent date comparison regardless of server timezone
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      today.setHours(0, 0, 0, 0);

      // Find all players with lastPlayed before today
      // Only players from previous days will be moved to history
      // Players with lastPlayed = today will remain in the queue
      const oldPlayers = await this.queuePlayersRepository.find({
        where: {
          lastPlayed: LessThan(today),
        },
      });

      if (oldPlayers.length > 0) {
        this.logger.log(
          `Found ${oldPlayers.length} player(s) from previous days. Moving to history...`,
        );

        // Move each player to history
        const historyRecords = oldPlayers.map((player) => {
          return this.queuePlayersHistoryRepository.create({
            userId: player.userId,
            originalId: player.id,
            name: player.name,
            sex: player.sex,
            skill: player.skill,
            gamesPlayed: player.gamesPlayed,
            status: player.status,
            lastPlayed: player.lastPlayed || new Date(),
            createdAt: player.createdAt,
            updatedAt: player.updatedAt,
            archivedAt: new Date(),
          });
        });

        // Save all history records
        await this.queuePlayersHistoryRepository.save(historyRecords);
        this.logger.log(`Successfully moved ${historyRecords.length} player(s) to history.`);

        // Delete players from current table after moving to history
        const playerIds = oldPlayers.map((p) => p.id);
        await this.queuePlayersRepository.delete(playerIds);
        this.logger.log(`Removed ${playerIds.length} player(s) from current players table.`);
      } else {
        this.logger.log('No old players found. All players are current.');
      }

      // Delete history records older than 30 days to maintain history limit
      const deletedCount = await this.deleteOldHistoryRecords(30);
      if (deletedCount > 0) {
        this.logger.log(`Removed ${deletedCount} old history record(s) older than 30 days.`);
      }

      this.logger.log('Daily player cleanup task completed successfully.');
    } catch (error) {
      this.logger.error('Error during daily player cleanup:', error);
    }
  }

  /**
   * Manual cleanup method that can be called on-demand
   * This can be used for testing or manual triggering
   * Moves players to history and returns the results
   */
  async manualCleanup(): Promise<{
    message: string;
    oldPlayersCount: number;
    movedToHistory: number;
    oldPlayers: QueuePlayer[];
  }> {
    this.logger.log('Manual cleanup triggered...');

    // Get today's date in local timezone (date only, no time component)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(0, 0, 0, 0);

    const oldPlayers = await this.queuePlayersRepository.find({
      where: {
        lastPlayed: LessThan(today),
      },
    });

    let movedToHistory = 0;
    if (oldPlayers.length > 0) {
      // Move players to history
      const historyRecords = oldPlayers.map((player) => {
        return this.queuePlayersHistoryRepository.create({
          userId: player.userId,
          originalId: player.id,
          name: player.name,
          sex: player.sex,
          skill: player.skill,
          gamesPlayed: player.gamesPlayed,
          status: player.status,
          lastPlayed: player.lastPlayed || new Date(),
          createdAt: player.createdAt,
          updatedAt: player.updatedAt,
          archivedAt: new Date(),
        });
      });

      await this.queuePlayersHistoryRepository.save(historyRecords);
      movedToHistory = historyRecords.length;

      // Delete from current table
      const playerIds = oldPlayers.map((p) => p.id);
      await this.queuePlayersRepository.delete(playerIds);
    }

    return {
      message: `Found ${oldPlayers.length} player(s) from previous days. ${movedToHistory} moved to history.`,
      oldPlayersCount: oldPlayers.length,
      movedToHistory,
      oldPlayers,
    };
  }

  /**
   * Delete history records older than a specified number of days
   * This helps keep the database clean by removing very old history records
   * 
   * @param daysToKeep - Number of days to keep in history (default: 30)
   *                     Example: If daysToKeep = 30 and today is Nov 21,
   *                     this will delete all history records with archivedAt before Oct 22
   * @returns Number of deleted history records
   */
  async deleteOldHistoryRecords(daysToKeep: number = 30): Promise<number> {
    this.logger.log(`Deleting history records older than ${daysToKeep} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    cutoffDate.setHours(0, 0, 0, 0);

    const result = await this.queuePlayersHistoryRepository.delete({
      archivedAt: LessThan(cutoffDate),
    });

    const deletedCount = result.affected || 0;
    this.logger.log(`Deleted ${deletedCount} old history record(s)`);

    return deletedCount;
  }

  /**
   * Delete players older than a specified number of days (legacy method)
   * This is kept for backward compatibility but now deletes from history table
   * 
   * @param daysToKeep - Number of days to keep in history (default: 30)
   * @returns Number of deleted players
   */
  async deleteOldPlayers(daysToKeep: number = 30): Promise<number> {
    return this.deleteOldHistoryRecords(daysToKeep);
  }

  /**
   * Save all current players to history
   * This creates history records for all players in the current queue
   * Players remain in the current table after being saved to history
   * 
   * @param userId - The user ID to filter players
   * @returns Information about the saved players
   */
  async savePlayersToHistory(userId: number): Promise<{
    message: string;
    savedCount: number;
    players: QueuePlayer[];
  }> {
    this.logger.log(`Saving today's players to history for user ${userId}...`);

    // Get all current players for this user
    // This saves all players in the queue to history without removing them
    const currentPlayers = await this.queuePlayersRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });

    if (currentPlayers.length === 0) {
      this.logger.log('No players found to save to history.');
      return {
        message: 'No players found to save to history.',
        savedCount: 0,
        players: [],
      };
    }

    // Create history records for all players
    const historyRecords = currentPlayers.map((player) => {
      return this.queuePlayersHistoryRepository.create({
        userId: player.userId,
        originalId: player.id,
        name: player.name,
        sex: player.sex,
        skill: player.skill,
        gamesPlayed: player.gamesPlayed,
        status: player.status,
        lastPlayed: player.lastPlayed || new Date(),
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
        archivedAt: new Date(),
      });
    });

    // Save all history records
    await this.queuePlayersHistoryRepository.save(historyRecords);
    this.logger.log(`Successfully saved ${historyRecords.length} player(s) to history.`);

    // Note: Players remain in the current table - they are not deleted
    // This allows users to continue using the same players while having a history record

    return {
      message: `Successfully saved ${historyRecords.length} player(s) to history.`,
      savedCount: historyRecords.length,
      players: currentPlayers,
    };
  }

  /**
   * Clear all history records for a specific user
   * This deletes:
   * 1. Players from the active queue_players table with lastPlayed dates before today (what's shown in UI as history)
   * 2. All archived records from the queue_players_history table
   * 
   * @param userId - The user ID to filter history records
   * @returns Information about the deleted records
   */
  async clearHistory(userId: number): Promise<{
    message: string;
    deletedCount: number;
    historyTableDeletedCount: number;
  }> {
    this.logger.log(`Clearing all history records for user ${userId}...`);

    // Get today's date in local timezone (date only, no time component)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(0, 0, 0, 0);

    // Delete players from active queue that have lastPlayed dates before today
    // These are the players shown as "history" in the UI
    const activeHistoryResult = await this.queuePlayersRepository.delete({
      userId,
      lastPlayed: LessThan(today),
    });

    const activeHistoryDeletedCount = activeHistoryResult.affected || 0;
    this.logger.log(`Deleted ${activeHistoryDeletedCount} player(s) from active queue with old lastPlayed dates for user ${userId}.`);

    // Also delete all history records from the history table
    const historyTableResult = await this.queuePlayersHistoryRepository.delete({
      userId,
    });

    const historyTableDeletedCount = historyTableResult.affected || 0;
    this.logger.log(`Deleted ${historyTableDeletedCount} history record(s) from history table for user ${userId}.`);

    const totalDeleted = activeHistoryDeletedCount + historyTableDeletedCount;

    return {
      message: `Successfully cleared ${totalDeleted} history record(s) (${activeHistoryDeletedCount} from active queue, ${historyTableDeletedCount} from history table).`,
      deletedCount: totalDeleted,
      historyTableDeletedCount,
    };
  }
}


