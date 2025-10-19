import { Gender } from '../entities/user.entity';
export declare class CreateUserDto {
    name: string;
    age: number;
    sex: Gender;
    username: string;
    email: string;
    password: string;
    contact_number?: string;
}
