import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private configService;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File, subfolder?: string): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
    deleteOldAvatar(userId: number, usersService: any): Promise<void>;
}
