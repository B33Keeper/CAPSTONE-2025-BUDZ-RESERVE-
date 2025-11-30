import { IsEnum, IsString, IsOptional } from 'class-validator';

export class UpdateFeeManagementDto {
  @IsOptional()
  @IsEnum(['paid', 'unpaid'])
  paymentStatus?: 'paid' | 'unpaid';

  @IsOptional()
  @IsString()
  notes?: string | null;
}

