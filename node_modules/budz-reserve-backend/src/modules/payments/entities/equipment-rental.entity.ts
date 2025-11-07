import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EquipmentRentalItem } from './equipment-rental-item.entity';

@Entity('equipment_rentals')
export class EquipmentRental {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reservation_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => EquipmentRentalItem, (item) => item.rental)
  items: EquipmentRentalItem[];
}


