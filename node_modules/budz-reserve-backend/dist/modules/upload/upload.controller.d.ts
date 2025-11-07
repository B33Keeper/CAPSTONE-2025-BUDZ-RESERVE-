import { UploadService } from './upload.service';
import { UsersService } from '../users/users.service';
export declare class UploadController {
    private readonly uploadService;
    private readonly usersService;
    constructor(uploadService: UploadService, usersService: UsersService);
    uploadAvatar(file: Express.Multer.File, req: any): Promise<{
        message: string;
        profilePicture: string;
    }>;
    uploadGeneral(file: Express.Multer.File): Promise<{
        message: string;
        filePath: string;
    }>;
}
