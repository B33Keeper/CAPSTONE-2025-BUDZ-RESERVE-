import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReservationStatus } from './reservation.entity';

@Entity('reservations_history')
export class ReservationHistory {
  @PrimaryGeneratedColumn()
  History_ID: number;

  @Column({ name: 'original_id', type: 'int' })
  Original_ID: number;

  @Column({ name: 'User_ID', type: 'int' })
  User_ID: number;

  @Column({ name: 'Court_ID', type: 'int' })
  Court_ID: number;

  @Column({ name: 'Reservation_Date', type: 'date' })
  Reservation_Date: Date;

  @Column({ name: 'Start_Time', type: 'time' })
  Start_Time: string;

  @Column({ name: 'End_Time', type: 'time' })
  End_Time: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.CONFIRMED,
  })
  Status: ReservationStatus;

  @Column({ name: 'Total_Amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  Total_Amount: number;

  @Column({ name: 'Reference_Number', nullable: true })
  Reference_Number: string;

  @Column({ name: 'Paymongo_Reference_Number', nullable: true })
  Paymongo_Reference_Number: string;

  @Column({ type: 'text', nullable: true })
  Notes: string;

  @Column({ name: 'Is_Admin_Created', type: 'boolean', default: false })
  Is_Admin_Created: boolean;

  @Column({ name: 'Created_at', type: 'datetime' })
  Created_at: Date;

  @Column({ name: 'Updated_at', type: 'datetime' })
  Updated_at: Date;

  @Column({ name: 'Archived_at', type: 'datetime' })
  Archived_at: Date;
}

