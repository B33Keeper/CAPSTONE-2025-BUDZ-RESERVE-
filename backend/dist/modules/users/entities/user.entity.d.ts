import { Reservation } from '../../reservations/entities/reservation.entity';
export declare enum Gender {
    MALE = "Male",
    FEMALE = "Female",
    OTHER = "Other"
}
export declare class User {
    id: number;
    name: string;
    age: number;
    sex: Gender;
    username: string;
    email: string;
    password: string;
    contact_number: string;
    profile_picture: string;
    is_active: boolean;
    is_verified: boolean;
    role: string;
    verification_token: string;
    reset_password_token: string;
    reset_password_expires: Date;
    created_at: Date;
    updated_at: Date;
    reservations: Reservation[];
}
