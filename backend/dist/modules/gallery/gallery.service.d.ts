import { Repository } from 'typeorm';
import { Gallery } from './entities/gallery.entity';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
export declare class GalleryService {
    private galleryRepository;
    constructor(galleryRepository: Repository<Gallery>);
    create(createGalleryDto: CreateGalleryDto): Promise<Gallery>;
    findAll(): Promise<Gallery[]>;
    findOne(id: number): Promise<Gallery>;
    update(id: number, updateGalleryDto: UpdateGalleryDto): Promise<Gallery>;
    remove(id: number): Promise<void>;
    updateStatus(id: number, status: string): Promise<Gallery>;
    reorder(ids: number[]): Promise<void>;
}
