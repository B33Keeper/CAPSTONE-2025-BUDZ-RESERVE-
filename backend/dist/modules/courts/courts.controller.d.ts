import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
export declare class CourtsController {
    private readonly courtsService;
    constructor(courtsService: CourtsService);
    create(createCourtDto: CreateCourtDto): Promise<import("./entities/court.entity").Court>;
    findAll(): Promise<import("./entities/court.entity").Court[]>;
    getAvailableCourts(): Promise<import("./entities/court.entity").Court[]>;
    getCourtCount(): Promise<number>;
    getAvailableCourtCount(): Promise<number>;
    findOne(id: number): Promise<import("./entities/court.entity").Court>;
    update(id: number, updateCourtDto: UpdateCourtDto): Promise<import("./entities/court.entity").Court>;
    remove(id: number): Promise<void>;
}
