import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCanManageQueueing1737129600000 implements MigrationInterface {
  name = 'AddCanManageQueueing1737129600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`can_manage_queueing\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`role\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      DROP COLUMN \`can_manage_queueing\`
    `);
  }
}

