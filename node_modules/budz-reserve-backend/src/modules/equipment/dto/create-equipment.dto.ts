import { IsString, IsNumber, IsOptional, Length, Min } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  @Length(1, 100)
  equipment_name: string;

  @IsNumber()
  @Min(0)
  stocks: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
