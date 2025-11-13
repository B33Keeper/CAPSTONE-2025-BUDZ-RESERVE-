import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('queue_players')
export class QueuePlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  sex: 'male' | 'female';

  @Column({ type: 'varchar', length: 20 })
  skill: 'Beginner' | 'Intermediate' | 'Advanced';

  @Column({ name: 'games_played', type: 'int', default: 0 })
  gamesPlayed: number;

  @Column({ type: 'varchar', length: 20, default: 'In Queue' })
  status: 'In Queue' | 'Waiting';

  @Column({ name: 'last_played', type: 'date', nullable: true })
  lastPlayed: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

