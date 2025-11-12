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
  @Matches(/^\/|https?:\/\//, {
    message: 'image_path must be a relative path starting with "/" or a valid URL',
  })
  image_path?: string;

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
