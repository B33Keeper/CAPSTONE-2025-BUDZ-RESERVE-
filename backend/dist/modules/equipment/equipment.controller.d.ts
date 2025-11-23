import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UploadService } from '../upload/upload.service';
export declare class EquipmentController {
    private readonly equipmentService;
    private readonly uploadService;
    private readonly allowedImageMimeTypes;
    constructor(equipmentService: EquipmentService, uploadService: UploadService);
    private validateImage;
    create(createEquipmentDto: CreateEquipmentDto, file?: Express.Multer.File): Promise<import("./entities/equipment.entity").Equipment>;
    findAll(): Promise<import("./entities/equipment.entity").Equipment[]>;
    getAvailableEquipment(): Promise<import("./entities/equipment.entity").Equipment[]>;
    findOne(id: number): Promise<import("./entities/equipment.entity").Equipment>;
    update(id: number, updateEquipmentDto: UpdateEquipmentDto, file?: Express.Multer.File): Promise<import("./entities/equipment.entity").Equipment>;
    remove(id: number): Promise<void>;
}
