"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserIdToQueueTables1737129600000 = void 0;
const typeorm_1 = require("typeorm");
class AddUserIdToQueueTables1737129600000 {
    async up(queryRunner) {
        let queuePlayersTable = await queryRunner.getTable('queue_players');
        const hasUserIdInPlayers = queuePlayersTable?.findColumnByName('user_id');
        if (!hasUserIdInPlayers) {
            await queryRunner.addColumn('queue_players', new typeorm_1.TableColumn({
                name: 'user_id',
                type: 'int',
                isNullable: false,
                default: 1,
            }));
            queuePlayersTable = await queryRunner.getTable('queue_players');
        }
        let queueMatchesTable = await queryRunner.getTable('queue_matches');
        const hasUserIdInMatches = queueMatchesTable?.findColumnByName('user_id');
        if (!hasUserIdInMatches) {
            await queryRunner.addColumn('queue_matches', new typeorm_1.TableColumn({
                name: 'user_id',
                type: 'int',
                isNullable: false,
                default: 1,
            }));
            queueMatchesTable = await queryRunner.getTable('queue_matches');
        }
        const queuePlayersIndexExists = queuePlayersTable?.indices?.some(idx => idx.name === 'idx_queue_players_user_id');
        if (!queuePlayersIndexExists) {
            await queryRunner.createIndex('queue_players', new typeorm_1.TableIndex({
                name: 'idx_queue_players_user_id',
                columnNames: ['user_id'],
            }));
        }
        const queueMatchesIndexExists = queueMatchesTable?.indices?.some(idx => idx.name === 'idx_queue_matches_user_id');
        if (!queueMatchesIndexExists) {
            await queryRunner.createIndex('queue_matches', new typeorm_1.TableIndex({
                name: 'idx_queue_matches_user_id',
                columnNames: ['user_id'],
            }));
        }
        console.log('⚠️  Clearing existing queue data to prevent cross-user data leakage...');
        await queryRunner.query(`DELETE FROM queue_matches`);
        await queryRunner.query(`DELETE FROM queue_players`);
        console.log('✅ Existing queue data cleared. Each user will now have separate records.');
    }
    async down(queryRunner) {
        let queuePlayersTable = await queryRunner.getTable('queue_players');
        const queuePlayersIndexExists = queuePlayersTable?.indices?.some(idx => idx.name === 'idx_queue_players_user_id');
        if (queuePlayersIndexExists) {
            await queryRunner.dropIndex('queue_players', 'idx_queue_players_user_id');
        }
        let queueMatchesTable = await queryRunner.getTable('queue_matches');
        const queueMatchesIndexExists = queueMatchesTable?.indices?.some(idx => idx.name === 'idx_queue_matches_user_id');
        if (queueMatchesIndexExists) {
            await queryRunner.dropIndex('queue_matches', 'idx_queue_matches_user_id');
        }
        queuePlayersTable = await queryRunner.getTable('queue_players');
        const hasUserIdInPlayers = queuePlayersTable?.findColumnByName('user_id');
        if (hasUserIdInPlayers) {
            await queryRunner.dropColumn('queue_players', 'user_id');
        }
        queueMatchesTable = await queryRunner.getTable('queue_matches');
        const hasUserIdInMatches = queueMatchesTable?.findColumnByName('user_id');
        if (hasUserIdInMatches) {
            await queryRunner.dropColumn('queue_matches', 'user_id');
        }
    }
}
exports.AddUserIdToQueueTables1737129600000 = AddUserIdToQueueTables1737129600000;
//# sourceMappingURL=1737129600000-AddUserIdToQueueTables.js.map