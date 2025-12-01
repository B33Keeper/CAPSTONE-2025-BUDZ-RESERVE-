import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UsersService } from '../users/users.service';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly usersService: UsersService,
  ) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    console.log('Upload request received:', { 
      hasFile: !!file, 
      fileInfo: file ? { 
        originalname: file.originalname, 
        mimetype: file.mimetype, 
        size: file.size 
      } : null,
      userId: req.user?.id 
    });
    
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 10MB.');
    }

    // Delete old avatar before uploading new one (only if it's a file path)
    await this.uploadService.deleteOldAvatar(req.user.id, this.usersService);
    
    // Convert image to base64 and store in database
    const base64Image = await this.uploadService.convertImageToBase64(file);
    
    // Update user's profile picture in database with base64
    await this.usersService.updateProfilePicture(req.user.id, base64Image);

    return {
      message: 'Avatar uploaded successfully',
      profilePicture: base64Image,
    };
  }

  @Post('general')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload general file' })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  async uploadGeneral(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const filePath = await this.uploadService.uploadFile(file, 'general');
    return {
      message: 'File uploaded successfully',
      filePath,
    };
  }
}
