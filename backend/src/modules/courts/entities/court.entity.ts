import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

export enum CourtStatus {
  AVAILABLE = 'Available',
  MAINTENANCE = 'Maintenance',
  UNAVAILABLE = 'Unavailable',
}

@Entity('courts')
export class Court {
  @PrimaryGeneratedColumn()
  Court_Id: number;

  @Column({ length: 100 })
  Court_Name: string;

  @Column({
    type: 'enum',
    enum: CourtStatus,
    default: CourtStatus.AVAILABLE,
  })
  Status: CourtStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  Price: number;

  @CreateDateColumn()
  Created_at: Date;

  @UpdateDateColumn()
  Updated_at: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.court)
  reservations: Reservation[];
}
