import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { FeeManagement, PaymentStatus } from './entities/fee-management.entity';
import { FeeManagementHistory } from './entities/fee-management-history.entity';
import { QueuePlayerHistory } from '../queue-players/entities/queue-player-history.entity';
import { QueuePlayer } from '../queue-players/entities/queue-player.entity';
import { CreateFeeManagementDto } from './dto/create-fee-management.dto';
import { UpdateFeeManagementDto } from './dto/update-fee-management.dto';

@Injectable()
export class FeeManagementService {
  private readonly logger = new Logger(FeeManagementService.name);

  constructor(
    @InjectRepository(FeeManagement)
    private readonly feeManagementRepository: Repository<FeeManagement>,
    @InjectRepository(FeeManagementHistory)
    private readonly feeManagementHistoryRepository: Repository<FeeManagementHistory>,
    @InjectRepository(QueuePlayerHistory)
    private readonly queuePlayersHistoryRepository: Repository<QueuePlayerHistory>,
    @InjectRepository(QueuePlayer)
    private readonly queuePlayersRepository: Repository<QueuePlayer>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new fee management record
   */
  async create(createFeeManagementDto: CreateFeeManagementDto): Promise<FeeManagement> {
    // Convert payment status string to enum
    const paymentStatus: PaymentStatus = createFeeManagementDto.paymentStatus === 'paid' 
      ? PaymentStatus.PAID 
      : PaymentStatus.UNPAID;
    
    // Convert feeDate to Date if it's a string
    const feeDate: Date = typeof createFeeManagementDto.feeDate === 'string' 
      ? new Date(createFeeManagementDto.feeDate) 
      : createFeeManagementDto.feeDate;

    const feeManagement = new FeeManagement();
    feeManagement.playerId = createFeeManagementDto.playerId;
    feeManagement.userId = createFeeManagementDto.userId ?? null;
    feeManagement.playerName = createFeeManagementDto.playerName;
    feeManagement.playerSex = createFeeManagementDto.playerSex;
    feeManagement.gamesPlayed = createFeeManagementDto.gamesPlayed;
    feeManagement.shuttleFee = createFeeManagementDto.shuttleFee;
    feeManagement.courtFee = createFeeManagementDto.courtFee;
    feeManagement.totalAmount = createFeeManagementDto.totalAmount;
    feeManagement.paymentStatus = paymentStatus;
    feeManagement.feeDate = feeDate;
    feeManagement.notes = createFeeManagementDto.notes ?? null;

    const saved = await this.feeManagementRepository.save(feeManagement);
    
    this.logger.log(`Created fee management record for player ${saved.playerName} (ID: ${saved.id})`);
    
    // NOTE: We do NOT automatically move records to history when creating fee management records.
    // Records should only be moved to history when explicitly requested via the "Save to History" button.
    // This allows users to mark players as paid/unpaid multiple times without losing the records.
    
    return saved;
  }

  /**
   * Get all current fee management records
   */
  async findAll(): Promise<FeeManagement[]> {
    return this.feeManagementRepository.find({
      order: { feeDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get fee management records by date
   */
  async findByDate(feeDate: Date | string): Promise<FeeManagement[]> {
    const date = typeof feeDate === 'string' ? new Date(feeDate) : feeDate;
    // Format date to YYYY-MM-DD for comparison
    const dateStr = date.toISOString().split('T')[0];
    return this.feeManagementRepository
      .createQueryBuilder('fee')
      .where('DATE(fee.feeDate) = :date', { date: dateStr })
      .orderBy('fee.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get a single fee management record by ID
   */
  async findOne(id: number): Promise<FeeManagement> {
    const feeManagement = await this.feeManagementRepository.findOne({
      where: { id },
    });

    if (!feeManagement) {
      throw new NotFoundException(`Fee management record with ID ${id} not found`);
    }

    return feeManagement;
  }

  /**
   * Update a fee management record
   */
  async update(id: number, updateFeeManagementDto: UpdateFeeManagementDto): Promise<FeeManagement> {
    const feeManagement = await this.findOne(id);

    if (updateFeeManagementDto.paymentStatus !== undefined) {
      feeManagement.paymentStatus = updateFeeManagementDto.paymentStatus as PaymentStatus;
      
      // If marking as paid, set paid_at timestamp in history if it exists
      if (updateFeeManagementDto.paymentStatus === 'paid') {
        feeManagement.updatedAt = new Date();
      }
    }

    if (updateFeeManagementDto.notes !== undefined) {
      feeManagement.notes = updateFeeManagementDto.notes;
    }

    const updated = await this.feeManagementRepository.save(feeManagement);
    this.logger.log(`Updated fee management record ${id}`);

    // NOTE: We do NOT automatically move records to history when updating payment status.
    // Records should only be moved to history when explicitly requested via the "Save to History" button.
    // This allows users to mark players as paid/unpaid multiple times without losing the records.

    return updated;
  }

  /**
   * Delete a fee management record
   */
  async remove(id: number): Promise<void> {
    const feeManagement = await this.findOne(id);
    await this.feeManagementRepository.remove(feeManagement);
    this.logger.log(`Deleted fee management record ${id}`);
  }

  /**
   * Get all historical fee management records for a specific user
   */
  async findHistory(userId: number): Promise<FeeManagementHistory[]> {
    return this.feeManagementHistoryRepository.find({
      where: { userId },
      order: { feeDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get historical fee management records by date for a specific user
   */
  async findHistoryByDate(feeDate: Date | string, userId: number): Promise<FeeManagementHistory[]> {
    const date = typeof feeDate === 'string' ? new Date(feeDate) : feeDate;
    // Format date to YYYY-MM-DD for comparison
    const dateStr = date.toISOString().split('T')[0];
    return this.feeManagementHistoryRepository
      .createQueryBuilder('fee')
      .where('DATE(fee.feeDate) = :date', { date: dateStr })
      .andWhere('fee.userId = :userId', { userId })
      .orderBy('fee.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Check if all players for a specific date are paid, and if so, move them to history
   */
  async checkAndMoveToHistoryIfAllPaid(feeDate: Date | string): Promise<void> {
    const date = typeof feeDate === 'string' ? new Date(feeDate) : feeDate;
    // Format date to YYYY-MM-DD for comparison
    const dateStr = date.toISOString().split('T')[0];
    
    // Get all fee records for this date
    const feeRecords = await this.feeManagementRepository
      .createQueryBuilder('fee')
      .where('DATE(fee.feeDate) = :date', { date: dateStr })
      .getMany();

    if (feeRecords.length === 0) {
      return;
    }

    // Check if all records are paid
    const allPaid = feeRecords.every(record => record.paymentStatus === PaymentStatus.PAID);

    if (allPaid) {
      this.logger.log(
        `All ${feeRecords.length} fee record(s) for date ${date.toISOString().split('T')[0]} are paid. Moving to history...`,
      );

      // Use transaction to ensure data integrity
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create history records
        const historyRecords = feeRecords.map((record) => {
          return this.feeManagementHistoryRepository.create({
            playerId: record.playerId,
            userId: record.userId,
            playerName: record.playerName,
            playerSex: record.playerSex,
            gamesPlayed: record.gamesPlayed,
            shuttleFee: record.shuttleFee,
            courtFee: record.courtFee,
            totalAmount: record.totalAmount,
            paymentStatus: record.paymentStatus,
            feeDate: record.feeDate,
            paidAt: record.paymentStatus === PaymentStatus.PAID ? new Date() : null,
            notes: record.notes,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          });
        });

        // Save all history records
        await queryRunner.manager.save(FeeManagementHistory, historyRecords);
        this.logger.log(`Successfully moved ${historyRecords.length} fee record(s) to history.`);

        // Also save queue players to history
        // Get current time for this batch to prevent duplicates
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get all unique user IDs from fee records
        const userIds = [...new Set(feeRecords.map(r => r.userId).filter(id => id !== null))];
        
        for (const userId of userIds) {
          // Get all current players for this user
          const currentPlayers = await this.queuePlayersRepository.find({
            where: { userId },
            order: { name: 'ASC' },
          });

          if (currentPlayers.length > 0) {
            // Check for existing history records with the same date and time (within 1 minute window to prevent duplicates)
            const oneMinuteAgo = new Date(now.getTime() - 60000);
            const existingHistoryRecords = await this.queuePlayersHistoryRepository
              .createQueryBuilder('history')
              .where('history.userId = :userId', { userId })
              .andWhere('DATE(history.archivedAt) = DATE(:now)', { now })
              .andWhere('history.time IS NOT NULL')
              .andWhere('TIME(history.time) >= TIME(:oneMinuteAgo)', { oneMinuteAgo })
              .andWhere('TIME(history.time) <= TIME(:now)', { now })
              .getMany();

            const existingNamesSet = new Set<string>();
            existingHistoryRecords.forEach((record) => {
              if (record.name) {
                existingNamesSet.add(record.name.toLowerCase().trim());
              }
            });

            // Filter out players that already exist in this batch
            const playersToSave = currentPlayers.filter((player) => {
              if (!player.name) {
                return false;
              }
              const normalizedName = player.name.toLowerCase().trim();
              return !existingNamesSet.has(normalizedName);
            });

            if (playersToSave.length > 0) {
              // Create history records with time to prevent duplicates
              const queueHistoryRecords = playersToSave.map((player) => {
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
                  archivedAt: now,
                  time: currentTime,
                });
              });

              await queryRunner.manager.save(QueuePlayerHistory, queueHistoryRecords);
              this.logger.log(`Successfully saved ${queueHistoryRecords.length} queue player(s) to history for user ${userId} at time ${currentTime}.`);
            }
          }
        }

        // Delete records from current table after moving to history
        const recordIds = feeRecords.map((r) => r.id);
        await queryRunner.manager.delete(FeeManagement, recordIds);
        this.logger.log(`Removed ${recordIds.length} fee record(s) from current fee management table.`);

        // Commit transaction
        await queryRunner.commitTransaction();
      } catch (error) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        this.logger.error(`Error moving fee records to history: ${error.message}`, error.stack);
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
      }
    }
  }

  /**
   * Manually move all paid records for a specific date to history
   */
  async movePaidRecordsToHistory(feeDate: Date | string, userId?: number): Promise<{
    message: string;
    movedCount: number;
    queuePlayersSavedCount: number;
  }> {
    const date = typeof feeDate === 'string' ? new Date(feeDate) : feeDate;
    // Format date to YYYY-MM-DD for comparison
    const dateStr = date.toISOString().split('T')[0];
    
    // Build query for paid records
    const queryBuilder = this.feeManagementRepository
      .createQueryBuilder('fee')
      .where('DATE(fee.feeDate) = :date', { date: dateStr })
      .andWhere('fee.paymentStatus = :status', { status: PaymentStatus.PAID });
    
    // Filter by userId if provided
    if (userId) {
      queryBuilder.andWhere('fee.userId = :userId', { userId });
    }
    
    const paidRecords = await queryBuilder.getMany();

    if (paidRecords.length === 0) {
      return {
        message: 'No paid records found for this date',
        movedCount: 0,
        queuePlayersSavedCount: 0,
      };
    }

    // Use transaction to ensure data integrity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate unique batch_id for this save operation
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create history records with batch_id
      const historyRecords = paidRecords.map((record) => {
        return this.feeManagementHistoryRepository.create({
          playerId: record.playerId,
          userId: record.userId,
          batchId: batchId,
          playerName: record.playerName,
          playerSex: record.playerSex,
          gamesPlayed: record.gamesPlayed,
          shuttleFee: record.shuttleFee,
          courtFee: record.courtFee,
          totalAmount: record.totalAmount,
          paymentStatus: record.paymentStatus,
          feeDate: record.feeDate,
          paidAt: new Date(),
          notes: record.notes,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        });
      });

      // Save all history records
      await queryRunner.manager.save(FeeManagementHistory, historyRecords);

      // Also save queue players to history
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all unique user IDs from paid records
      const userIds = [...new Set(paidRecords.map(r => r.userId).filter(id => id !== null))];
      
      for (const userId of userIds) {
        // Get all current players for this user
        const currentPlayers = await this.queuePlayersRepository.find({
          where: { userId },
          order: { name: 'ASC' },
        });

        if (currentPlayers.length > 0) {
          // Check for existing history records with the same date and time (within 1 minute window)
          const oneMinuteAgo = new Date(now.getTime() - 60000);
          const existingHistoryRecords = await this.queuePlayersHistoryRepository
            .createQueryBuilder('history')
            .where('history.userId = :userId', { userId })
            .andWhere('DATE(history.archivedAt) = DATE(:now)', { now })
            .andWhere('history.time IS NOT NULL')
            .andWhere('TIME(history.time) >= TIME(:oneMinuteAgo)', { oneMinuteAgo })
            .andWhere('TIME(history.time) <= TIME(:now)', { now })
            .getMany();

          const existingNamesSet = new Set<string>();
          existingHistoryRecords.forEach((record) => {
            if (record.name) {
              existingNamesSet.add(record.name.toLowerCase().trim());
            }
          });

          // Filter out players that already exist in this batch
          const playersToSave = currentPlayers.filter((player) => {
            if (!player.name) {
              return false;
            }
            const normalizedName = player.name.toLowerCase().trim();
            return !existingNamesSet.has(normalizedName);
          });

          if (playersToSave.length > 0) {
            // Create history records with time to prevent duplicates
            const queueHistoryRecords = playersToSave.map((player) => {
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
                archivedAt: now,
                time: currentTime,
              });
            });

            await queryRunner.manager.save(QueuePlayerHistory, queueHistoryRecords);
            this.logger.log(`Successfully saved ${queueHistoryRecords.length} queue player(s) to history for user ${userId} at time ${currentTime}.`);
          }
        }
      }

      // Delete records from current table
      const recordIds = paidRecords.map((r) => r.id);
      await queryRunner.manager.delete(FeeManagement, recordIds);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Get queue players saved count (from the loop above)
      let queuePlayersSavedCount = 0;
      const userIdsForCount = [...new Set(paidRecords.map(r => r.userId).filter(id => id !== null))];
      for (const uid of userIdsForCount) {
        const currentPlayers = await this.queuePlayersRepository.find({
          where: { userId: uid },
        });
        if (currentPlayers.length > 0) {
          queuePlayersSavedCount += currentPlayers.length;
        }
      }

      this.logger.log(`Manually moved ${historyRecords.length} paid fee record(s) to history with batch_id ${batchId}.`);

      return {
        message: `Successfully moved ${historyRecords.length} paid record(s) to history. ${queuePlayersSavedCount} queue player(s) also saved.`,
        movedCount: historyRecords.length,
        queuePlayersSavedCount,
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error manually moving fee records to history: ${error.message}`, error.stack);
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Get summary statistics for current fees
   */
  async getSummary(): Promise<{
    totalCollected: number;
    totalUnpaid: number;
    totalPlayers: number;
    paidPlayers: number;
    unpaidPlayers: number;
  }> {
    const allRecords = await this.findAll();

    const summary = allRecords.reduce(
      (acc, record) => {
        acc.totalPlayers++;
        if (record.paymentStatus === PaymentStatus.PAID) {
          acc.paidPlayers++;
          acc.totalCollected += Number(record.totalAmount);
        } else {
          acc.unpaidPlayers++;
          acc.totalUnpaid += Number(record.totalAmount);
        }
        return acc;
      },
      {
        totalCollected: 0,
        totalUnpaid: 0,
        totalPlayers: 0,
        paidPlayers: 0,
        unpaidPlayers: 0,
      },
    );

    return summary;
  }

  /**
   * Move all fee management records for today to history, but only if all are paid
   */
  async moveAllToHistoryIfAllPaid(feeDate: Date | string, userId?: number): Promise<{
    message: string;
    movedCount: number;
    queuePlayersSavedCount: number;
  }> {
    const date = typeof feeDate === 'string' ? new Date(feeDate) : feeDate;
    // Format date to YYYY-MM-DD for comparison
    const dateStr = date.toISOString().split('T')[0];
    
    // Build query for all records
    const queryBuilder = this.feeManagementRepository
      .createQueryBuilder('fee')
      .where('DATE(fee.feeDate) = :date', { date: dateStr });
    
    // Filter by userId if provided
    if (userId) {
      queryBuilder.andWhere('fee.userId = :userId', { userId });
    }
    
    const allRecords = await queryBuilder.getMany();

    if (allRecords.length === 0) {
      return {
        message: 'No fee management records found for this date',
        movedCount: 0,
        queuePlayersSavedCount: 0,
      };
    }

    // Check if all records are paid
    const allPaid = allRecords.every(record => record.paymentStatus === PaymentStatus.PAID);
    
    if (!allPaid) {
      const unpaidCount = allRecords.filter(r => r.paymentStatus === PaymentStatus.UNPAID).length;
      throw new BadRequestException(`Cannot move to history: ${unpaidCount} record(s) are still unpaid. All players must be marked as paid before saving to history.`);
    }

    // Use transaction to ensure data integrity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate unique batch_id for this save operation
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create history records for ALL records (since all are paid) with batch_id
      const historyRecords = allRecords.map((record) => {
        return this.feeManagementHistoryRepository.create({
          playerId: record.playerId,
          userId: record.userId,
          batchId: batchId,
          playerName: record.playerName,
          playerSex: record.playerSex,
          gamesPlayed: record.gamesPlayed,
          shuttleFee: record.shuttleFee,
          courtFee: record.courtFee,
          totalAmount: record.totalAmount,
          paymentStatus: record.paymentStatus,
          feeDate: record.feeDate,
          paidAt: new Date(),
          notes: record.notes,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        });
      });

      // Save all history records
      await queryRunner.manager.save(FeeManagementHistory, historyRecords);

      // Also save queue players to history
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      // Get all unique user IDs from all records
      const userIds = [...new Set(allRecords.map(r => r.userId).filter(id => id !== null))];
      let queuePlayersSavedCount = 0;
      
      for (const uid of userIds) {
        // Get all current players for this user
        const currentPlayers = await this.queuePlayersRepository.find({
          where: { userId: uid },
          order: { name: 'ASC' },
        });

        if (currentPlayers.length > 0) {
          // Check for existing history records with the same date and time (within 1 minute window)
          const oneMinuteAgo = new Date(now.getTime() - 60000);
          const existingHistoryRecords = await this.queuePlayersHistoryRepository
            .createQueryBuilder('history')
            .where('history.userId = :userId', { userId: uid })
            .andWhere('DATE(history.archivedAt) = DATE(:now)', { now })
            .andWhere('history.time IS NOT NULL')
            .andWhere('TIME(history.time) >= TIME(:oneMinuteAgo)', { oneMinuteAgo })
            .andWhere('TIME(history.time) <= TIME(:now)', { now })
            .getMany();

          const existingNamesSet = new Set<string>();
          existingHistoryRecords.forEach((record) => {
            if (record.name) {
              existingNamesSet.add(record.name.toLowerCase().trim());
            }
          });

          // Filter out players that already exist in this batch
          const playersToSave = currentPlayers.filter((player) => {
            if (!player.name) {
              return false;
            }
            const normalizedName = player.name.toLowerCase().trim();
            return !existingNamesSet.has(normalizedName);
          });

          if (playersToSave.length > 0) {
            // Create history records with time to prevent duplicates
            const queueHistoryRecords = playersToSave.map((player) => {
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
                archivedAt: now,
                time: currentTime,
              });
            });

            await queryRunner.manager.save(QueuePlayerHistory, queueHistoryRecords);
            queuePlayersSavedCount += queueHistoryRecords.length;
            this.logger.log(`Successfully saved ${queueHistoryRecords.length} queue player(s) to history for user ${uid} at time ${currentTime}.`);
          }
        }
      }

      // Delete records from current table
      const recordIds = allRecords.map((r) => r.id);
      await queryRunner.manager.delete(FeeManagement, recordIds);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(`Moved ${historyRecords.length} fee management record(s) to history for date ${dateStr} with batch_id ${batchId}.`);

      return {
        message: `Successfully moved ${historyRecords.length} record(s) to history. ${queuePlayersSavedCount} queue player(s) also saved.`,
        movedCount: historyRecords.length,
        queuePlayersSavedCount,
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error moving fee records to history: ${error.message}`, error.stack);
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Clear all fee management records for today's date
   */
  async clearTodayRecords(): Promise<{
    message: string;
    deletedCount: number;
  }> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Get all fee records for today
    const todayRecords = await this.feeManagementRepository
      .createQueryBuilder('fee')
      .where('DATE(fee.feeDate) = :date', { date: dateStr })
      .getMany();

    if (todayRecords.length === 0) {
      return {
        message: 'No fee management records found for today',
        deletedCount: 0,
      };
    }

    // Delete all records for today
    const recordIds = todayRecords.map((r) => r.id);
    await this.feeManagementRepository.delete(recordIds);

    this.logger.log(`Cleared ${recordIds.length} fee management record(s) for today (${dateStr})`);

    return {
      message: `Successfully cleared ${recordIds.length} fee management record(s) for today`,
      deletedCount: recordIds.length,
    };
  }
}

