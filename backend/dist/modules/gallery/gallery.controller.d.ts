import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { UploadService } from '../upload/upload.service';
export declare class GalleryController {
    private readonly galleryService;
    private readonly uploadService;
    constructor(galleryService: GalleryService, uploadService: UploadService);
    create(createGalleryDto: CreateGalleryDto): Promise<import("./entities/gallery.entity").Gallery>;
    findAll(): Promise<import("./entities/gallery.entity").Gallery[]>;
    findOne(id: string): Promise<import("./entities/gallery.entity").Gallery>;
    update(id: string, updateGalleryDto: UpdateGalleryDto): Promise<import("./entities/gallery.entity").Gallery>;
    remove(id: string): Promise<void>;
    uploadImage(file: Express.Multer.File, title: string, description?: string): Promise<import("./entities/gallery.entity").Gallery>;
    updateStatus(id: string, status: string): Promise<import("./entities/gallery.entity").Gallery>;
    reorder(ids: number[]): Promise<void>;
}
