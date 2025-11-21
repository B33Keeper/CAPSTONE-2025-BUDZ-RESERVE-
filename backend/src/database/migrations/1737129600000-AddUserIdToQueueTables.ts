import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddUserIdToQueueTables1737129600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if user_id column already exists in queue_players
    const queuePlayersTable = await queryRunner.getTable('queue_players');
    const hasUserIdInPlayers = queuePlayersTable?.findColumnByName('user_id');

    if (!hasUserIdInPlayers) {
      await queryRunner.addColumn(
        'queue_players',
        new TableColumn({
          name: 'user_id',
          type: 'int',
          isNullable: false,
          default: 1,
        }),
      );
    }

    // Check if user_id column already exists in queue_matches
    const queueMatchesTable = await queryRunner.getTable('queue_matches');
    const hasUserIdInMatches = queueMatchesTable?.findColumnByName('user_id');

    if (!hasUserIdInMatches) {
      await queryRunner.addColumn(
        'queue_matches',
        new TableColumn({
          name: 'user_id',
          type: 'int',
          isNullable: false,
          default: 1,
        }),
      );
    }

    // Create indexes for better query performance
    const queuePlayersIndexExists = await queryRunner.hasIndex('queue_players', 'idx_queue_players_user_id');
    if (!queuePlayersIndexExists) {
      await queryRunner.createIndex(
        'queue_players',
        new TableIndex({
          name: 'idx_queue_players_user_id',
          columnNames: ['user_id'],
        }),
      );
    }

    const queueMatchesIndexExists = await queryRunner.hasIndex('queue_matches', 'idx_queue_matches_user_id');
    if (!queueMatchesIndexExists) {
      await queryRunner.createIndex(
        'queue_matches',
        new TableIndex({
          name: 'idx_queue_matches_user_id',
          columnNames: ['user_id'],
        }),
      );
    }

    // IMPORTANT: Clear existing data to prevent cross-user data leakage
    // All existing records have user_id = 1, which would show up for all users
    // This ensures each user starts with a clean slate
    // If you need to preserve data, comment out these lines and manually assign user_id
    console.log('⚠️  Clearing existing queue data to prevent cross-user data leakage...');
    await queryRunner.query(`DELETE FROM queue_matches`);
    await queryRunner.query(`DELETE FROM queue_players`);
    console.log('✅ Existing queue data cleared. Each user will now have separate records.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    const queuePlayersIndexExists = await queryRunner.hasIndex('queue_players', 'idx_queue_players_user_id');
    if (queuePlayersIndexExists) {
      await queryRunner.dropIndex('queue_players', 'idx_queue_players_user_id');
    }

    const queueMatchesIndexExists = await queryRunner.hasIndex('queue_matches', 'idx_queue_matches_user_id');
    if (queueMatchesIndexExists) {
      await queryRunner.dropIndex('queue_matches', 'idx_queue_matches_user_id');
    }

    // Remove columns
    const queuePlayersTable = await queryRunner.getTable('queue_players');
    const hasUserIdInPlayers = queuePlayersTable?.findColumnByName('user_id');
    if (hasUserIdInPlayers) {
      await queryRunner.dropColumn('queue_players', 'user_id');
    }

    const queueMatchesTable = await queryRunner.getTable('queue_matches');
    const hasUserIdInMatches = queueMatchesTable?.findColumnByName('user_id');
    if (hasUserIdInMatches) {
      await queryRunner.dropColumn('queue_matches', 'user_id');
    }
  }
}

