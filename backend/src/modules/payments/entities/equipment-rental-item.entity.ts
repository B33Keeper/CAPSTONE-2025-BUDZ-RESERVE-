import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EquipmentRental } from './equipment-rental.entity';

@Entity('equipment_rental_items')
export class EquipmentRentalItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rental_id: number;

  @Column()
  equipment_id: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  hours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourly_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => EquipmentRental, (rental) => rental.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rental_id' })
  rental: EquipmentRental;
}


