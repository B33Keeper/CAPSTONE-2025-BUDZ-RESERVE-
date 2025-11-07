import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File, subfolder: string = 'general'): Promise<string> {
    // Ensure we use absolute path
    const uploadDir = this.configService.get('UPLOAD_DEST', 'uploads');
    const fullUploadDir = path.isAbsolute(uploadDir) 
      ? path.join(uploadDir, subfolder)
      : path.join(process.cwd(), uploadDir, subfolder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(fullUploadDir)) {
      fs.mkdirSync(fullUploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(fullUploadDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return relative path
    return `/uploads/${subfolder}/${fileName}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
  }

  async deleteOldAvatar(userId: number, usersService: any): Promise<void> {
    try {
      // Get user's current profile picture
      const user = await usersService.findOne(userId);
      if (user && user.profile_picture) {
        // Only delete if it's a local file (not external URL)
        if (!user.profile_picture.startsWith('http')) {
          console.log(`🗑️ Deleting old avatar: ${user.profile_picture}`);
          await this.deleteFile(user.profile_picture);
        }
      }
    } catch (error) {
      console.error('Error deleting old avatar:', error);
      // Don't throw error - we don't want to fail the upload if deletion fails
    }
  }
}
