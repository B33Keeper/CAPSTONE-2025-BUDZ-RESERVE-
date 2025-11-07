import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
export declare class AnnouncementsService {
    private announcementsRepository;
    constructor(announcementsRepository: Repository<Announcement>);
    create(createAnnouncementDto: CreateAnnouncementDto, userId: number): Promise<Announcement>;
    findLatest(): Promise<Announcement | null>;
    findAll(): Promise<Announcement[]>;
    findOne(id: number): Promise<Announcement>;
    remove(id: number): Promise<void>;
    update(id: number, updateDto: Partial<CreateAnnouncementDto>): Promise<Announcement>;
}
