import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
}

@Entity('fee_management_history')
@Index('idx_fee_management_history_player_id', ['playerId'])
@Index('idx_fee_management_history_user_id', ['userId'])
@Index('idx_fee_management_history_fee_date', ['feeDate'])
@Index('idx_fee_management_history_payment_status', ['paymentStatus'])
export class FeeManagementHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'player_id', type: 'int' })
  playerId: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ name: 'player_name', type: 'varchar', length: 120 })
  playerName: string;

  @Column({ name: 'player_sex', type: 'enum', enum: ['male', 'female'] })
  playerSex: 'male' | 'female';

  @Column({ name: 'games_played', type: 'int', default: 0 })
  gamesPlayed: number;

  @Column({ name: 'shuttle_fee', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  shuttleFee: number;

  @Column({ name: 'court_fee', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  courtFee: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  totalAmount: number;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'fee_date', type: 'date' })
  feeDate: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

