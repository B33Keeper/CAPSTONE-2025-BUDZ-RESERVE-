import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  QueueMatchGameType,
  QueueMatchTeamPlayer,
  QueueMatchWinner,
} from './queue-match.entity';

@Entity('queue_matches_history')
export class QueueMatchHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'original_id', type: 'int' })
  originalId: number;

  @Column({ type: 'enum', enum: QueueMatchGameType })
  gameType: QueueMatchGameType;

  @Column({ type: 'json' })
  teamA: QueueMatchTeamPlayer[];

  @Column({ type: 'json' })
  teamB: QueueMatchTeamPlayer[];

  @Column({ name: 'court_id', type: 'int', nullable: true })
  courtId: number | null;

  @Column({ name: 'court_name', type: 'varchar', length: 100, nullable: true })
  courtName: string | null;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  @Column({
    type: 'enum',
    enum: QueueMatchWinner,
    nullable: true,
  })
  winner: QueueMatchWinner | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'datetime' })
  archivedAt: Date;
}

