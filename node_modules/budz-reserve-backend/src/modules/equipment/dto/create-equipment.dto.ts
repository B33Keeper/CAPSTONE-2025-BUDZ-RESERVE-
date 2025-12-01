import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Length, Min, Matches, MaxLength } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  @Length(1, 100)
  equipment_name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stocks: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  image_path?: string; // Can be base64 data URL, file path, or external URL

  @IsOptional()
  @IsString()
  @MaxLength(100)
  unit?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  weight?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tension?: string | null;
}
