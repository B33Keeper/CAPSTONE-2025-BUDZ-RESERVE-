import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
export declare class EquipmentController {
    private readonly equipmentService;
    constructor(equipmentService: EquipmentService);
    create(createEquipmentDto: CreateEquipmentDto): Promise<import("./entities/equipment.entity").Equipment>;
    findAll(): Promise<import("./entities/equipment.entity").Equipment[]>;
    getAvailableEquipment(): Promise<import("./entities/equipment.entity").Equipment[]>;
    findOne(id: number): Promise<import("./entities/equipment.entity").Equipment>;
    update(id: number, updateEquipmentDto: UpdateEquipmentDto): Promise<import("./entities/equipment.entity").Equipment>;
    remove(id: number): Promise<void>;
}
