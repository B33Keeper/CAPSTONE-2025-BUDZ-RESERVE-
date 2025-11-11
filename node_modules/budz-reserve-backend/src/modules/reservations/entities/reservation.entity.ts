import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Court } from '../../courts/entities/court.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum ReservationStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  Reservation_ID: number;

  @Column()
  User_ID: number;

  @Column()
  Court_ID: number;

  @Column({ type: 'date' })
  Reservation_Date: Date;

  @Column({ type: 'time' })
  Start_Time: string;

  @Column({ type: 'time' })
  End_Time: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  Status: ReservationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  Total_Amount: number;

  @Column({ nullable: true })
  Reference_Number: string;

  @Column({ nullable: true })
  Paymongo_Reference_Number: string;

  @Column({ type: 'text', nullable: true })
  Notes: string;

  @Column({ type: 'boolean', default: false })
  Is_Admin_Created: boolean;

  @CreateDateColumn()
  Created_at: Date;

  @UpdateDateColumn()
  Updated_at: Date;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'User_ID' })
  user: User;

  @ManyToOne(() => Court, (court) => court.reservations)
  @JoinColumn({ name: 'Court_ID' })
  court: Court;

  @OneToMany(() => Payment, (payment) => payment.reservation)
  payments: Payment[];
}
