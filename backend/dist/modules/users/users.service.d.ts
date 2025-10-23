import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    getUserCount(): Promise<number>;
    getActiveUserCount(): Promise<number>;
    findOne(id: number): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: number): Promise<void>;
    updateProfilePicture(id: number, profilePicture: string): Promise<User>;
    verifyPassword(user: User, password: string): Promise<boolean>;
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
    updatePassword(userId: number, newPassword: string): Promise<void>;
}
