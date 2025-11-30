import { IsInt, IsString, IsEnum, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateFeeManagementDto {
  @IsInt()
  playerId: number;

  @IsOptional()
  @IsInt()
  userId?: number | null;

  @IsString()
  playerName: string;

  @IsEnum(['male', 'female'])
  playerSex: 'male' | 'female';

  @IsInt()
  gamesPlayed: number;

  @IsNumber()
  shuttleFee: number;

  @IsNumber()
  courtFee: number;

  @IsNumber()
  totalAmount: number;

  @IsEnum(['paid', 'unpaid'])
  paymentStatus: 'paid' | 'unpaid';

  @IsDateString()
  feeDate: Date | string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

