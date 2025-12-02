import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('queue_players_history')
export class QueuePlayerHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'original_id', type: 'int' })
  originalId: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  sex: 'male' | 'female';

  @Column({ type: 'varchar', length: 20 })
  skill: 'Beginner' | 'Intermediate' | 'Advanced';

  @Column({ name: 'games_played', type: 'int', default: 0 })
  gamesPlayed: number;

  @Column({ type: 'varchar', length: 20 })
  status: 'In Queue' | 'Waiting' | 'In Match';

  @Column({ name: 'last_played', type: 'date', nullable: true })
  lastPlayed: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'datetime' })
  archivedAt: Date;

  @Column({ name: 'time', type: 'time', nullable: true })
  time: string | null;
}
