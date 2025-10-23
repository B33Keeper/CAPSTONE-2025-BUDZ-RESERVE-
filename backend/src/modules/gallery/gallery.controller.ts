import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { UploadService } from '../upload/upload.service';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create gallery item' })
  @ApiResponse({ status: 201, description: 'Gallery item created successfully' })
  create(@Body() createGalleryDto: CreateGalleryDto) {
    return this.galleryService.create(createGalleryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gallery items' })
  @ApiResponse({ status: 200, description: 'Gallery items retrieved successfully' })
  findAll() {
    return this.galleryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gallery item by ID' })
  @ApiResponse({ status: 200, description: 'Gallery item retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.galleryService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update gallery item' })
  @ApiResponse({ status: 200, description: 'Gallery item updated successfully' })
  update(@Param('id') id: string, @Body() updateGalleryDto: UpdateGalleryDto) {
    return this.galleryService.update(+id, updateGalleryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete gallery item' })
  @ApiResponse({ status: 200, description: 'Gallery item deleted successfully' })
  remove(@Param('id') id: string) {
    return this.galleryService.remove(+id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload gallery image' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
  ) {
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

    const filePath = await this.uploadService.uploadFile(file, 'gallery');
    
    const createGalleryDto: CreateGalleryDto = {
      title,
      description,
      image_path: filePath,
      status: 'active',
    };

    return this.galleryService.create(createGalleryDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update gallery item status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.galleryService.updateStatus(+id, status);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reorder gallery items' })
  @ApiResponse({ status: 200, description: 'Items reordered successfully' })
  reorder(@Body('ids') ids: number[]) {
    return this.galleryService.reorder(ids);
  }
}
