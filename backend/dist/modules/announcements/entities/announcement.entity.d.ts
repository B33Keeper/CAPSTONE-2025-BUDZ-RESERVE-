import { User } from '../../users/entities/user.entity';
export declare enum AnnouncementType {
    TEXT = "text",
    IMAGE = "image"
}
export declare class Announcement {
    id: number;
    title: string;
    content: string;
    image_url: string;
    announcement_type: AnnouncementType;
    is_active: boolean;
    created_by: number;
    creator: User;
    created_at: Date;
    updated_at: Date;
}
