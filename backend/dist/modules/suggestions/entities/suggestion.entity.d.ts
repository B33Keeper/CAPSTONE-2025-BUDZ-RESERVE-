import { User } from '../../users/entities/user.entity';
export declare class Suggestion {
    id: number;
    name: string;
    message: string;
    user_id: number;
    created_at: Date;
    updated_at: Date;
    user: User;
}
