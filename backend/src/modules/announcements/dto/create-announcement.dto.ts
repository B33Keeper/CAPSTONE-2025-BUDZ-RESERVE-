import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementType } from '../entities/announcement.entity';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Announcement content (for text type)' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Image URL (for image type)' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({ 
    description: 'Announcement type',
    enum: AnnouncementType,
    default: AnnouncementType.TEXT
  })
  @IsEnum(AnnouncementType)
  @IsNotEmpty()
  announcement_type: AnnouncementType;

  @ApiPropertyOptional({ description: 'Whether the announcement is active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

