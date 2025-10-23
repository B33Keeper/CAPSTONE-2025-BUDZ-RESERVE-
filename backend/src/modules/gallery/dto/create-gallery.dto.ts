import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateGalleryDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  image_path: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}
