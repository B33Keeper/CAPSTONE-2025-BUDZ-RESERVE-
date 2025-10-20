import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Reservation } from '../../reservations/entities/reservation.entity';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, nullable: true })
  name: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  sex: Gender;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ length: 20, nullable: true })
  contact_number: string;

  @Column({ type: 'varchar', nullable: true })
  profile_picture: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true })
  verification_token: string;

  @Column({ nullable: true })
  reset_password_token: string;

  @Column({ type: 'timestamp', nullable: true })
  reset_password_expires: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];
}
