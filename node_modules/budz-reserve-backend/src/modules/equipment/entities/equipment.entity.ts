import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('equipments')
export class Equipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  equipment_name: string;

  @Column({ type: 'int', default: 0 })
  stocks: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'Available' })
  status: string;

  @Column({ type: 'varchar', length: 255, default: '/assets/img/equipments/racket.png' })
  image_path: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unit: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  weight: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tension: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
