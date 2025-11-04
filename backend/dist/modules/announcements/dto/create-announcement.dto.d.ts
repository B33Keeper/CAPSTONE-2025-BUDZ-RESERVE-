import { AnnouncementType } from '../entities/announcement.entity';
export declare class CreateAnnouncementDto {
    title: string;
    content?: string;
    image_url?: string;
    announcement_type: AnnouncementType;
    is_active?: boolean;
}
