import { IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  reservation_id: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
