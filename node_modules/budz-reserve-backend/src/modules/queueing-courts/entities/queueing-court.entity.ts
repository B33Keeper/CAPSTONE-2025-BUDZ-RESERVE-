import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QueueingCourtStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  UNAVAILABLE = 'unavailable',
}

@Entity('queueing_courts')
export class QueueingCourt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: QueueingCourtStatus,
    default: QueueingCourtStatus.AVAILABLE,
  })
  status: QueueingCourtStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

