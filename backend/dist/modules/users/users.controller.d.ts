import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./entities/user.entity").User>;
    findAll(): Promise<import("./entities/user.entity").User[]>;
    getUserCount(): Promise<number>;
    getActiveUserCount(): Promise<number>;
    getProfile(req: any): Promise<import("./entities/user.entity").User>;
    findOne(id: number): Promise<import("./entities/user.entity").User>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<import("./entities/user.entity").User>;
    changePassword(req: any, body: any): Promise<{
        message: string;
    }>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<import("./entities/user.entity").User>;
    uploadAvatar(req: any, file: Express.Multer.File): Promise<import("./entities/user.entity").User>;
    remove(id: number): Promise<void>;
}
