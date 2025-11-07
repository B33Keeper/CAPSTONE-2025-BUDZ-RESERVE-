import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UploadService } from '../upload/upload.service';
export declare class AnnouncementsController {
    private readonly announcementsService;
    private readonly uploadService;
    constructor(announcementsService: AnnouncementsService, uploadService: UploadService);
    create(createAnnouncementDto: CreateAnnouncementDto, req: any): Promise<import("./entities/announcement.entity").Announcement>;
    createWithImage(body: any, file: Express.Multer.File, req: any): Promise<import("./entities/announcement.entity").Announcement>;
    findLatest(): Promise<import("./entities/announcement.entity").Announcement | null>;
    findAll(req: any): Promise<import("./entities/announcement.entity").Announcement[]>;
    findOne(id: string): Promise<import("./entities/announcement.entity").Announcement>;
    update(id: string, updateDto: Partial<CreateAnnouncementDto>, req: any): Promise<import("./entities/announcement.entity").Announcement>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
