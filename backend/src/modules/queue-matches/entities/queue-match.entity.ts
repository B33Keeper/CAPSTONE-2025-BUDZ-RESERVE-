import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { QueueingCourt } from '../../queueing-courts/entities/queueing-court.entity';

export enum QueueMatchStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum QueueMatchWinner {
  TEAM_A = 'teamA',
  TEAM_B = 'teamB',
  DRAW = 'draw',
}

export enum QueueMatchGameType {
  MENS_DOUBLES = 'mens-doubles',
  WOMENS_DOUBLES = 'womens-doubles',
  MIXED_DOUBLES = 'mixed-doubles',
}

export interface QueueMatchTeamPlayer {
  id: number;
  name: string;
  sex: 'male' | 'female';
  skill: 'Beginner' | 'Intermediate' | 'Advanced';
}

@Entity('queue_matches')
export class QueueMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: QueueMatchGameType })
  gameType: QueueMatchGameType;

  @Column({
    type: 'enum',
    enum: QueueMatchStatus,
    default: QueueMatchStatus.PENDING,
  })
  status: QueueMatchStatus;

  @Column({ type: 'json' })
  teamA: QueueMatchTeamPlayer[];

  @Column({ type: 'json' })
  teamB: QueueMatchTeamPlayer[];

  @Column({ name: 'court_id', nullable: true })
  courtId: number | null;

  @ManyToOne(() => QueueingCourt, { nullable: true })
  @JoinColumn({ name: 'court_id' })
  court: QueueingCourt | null;

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
}

