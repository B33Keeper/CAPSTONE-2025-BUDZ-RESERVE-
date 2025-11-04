import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UploadService } from '../upload/upload.service';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new announcement (Admin only)' })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    return await this.announcementsService.create(createAnnouncementDto, req.user.id);
  }

  @Post('with-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new announcement with image upload (Admin only)' })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  async createWithImage(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    // Validate file type
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type. Only images are allowed.');
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new BadRequestException('File too large. Maximum size is 10MB.');
      }

      // Upload image
      const imagePath = await this.uploadService.uploadFile(file, 'announcements');
      body.image_url = imagePath;
      body.announcement_type = 'image';
    }

    const createAnnouncementDto: CreateAnnouncementDto = {
      title: body.title,
      content: body.content || null,
      image_url: body.image_url || null,
      announcement_type: body.announcement_type || 'text',
      is_active: body.is_active !== undefined ? body.is_active === 'true' : true,
    };

    return await this.announcementsService.create(createAnnouncementDto, req.user.id);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest active announcement' })
  @ApiResponse({ status: 200, description: 'Latest announcement retrieved successfully' })
  async findLatest() {
    return await this.announcementsService.findLatest();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all announcements (Admin only)' })
  @ApiResponse({ status: 200, description: 'Announcements retrieved successfully' })
  async findAll(@Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    return await this.announcementsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get announcement by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Announcement retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return await this.announcementsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update announcement (Admin only)' })
  @ApiResponse({ status: 200, description: 'Announcement updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateAnnouncementDto>,
    @Request() req: any,
  ) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    return await this.announcementsService.update(+id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete announcement (Admin only)' })
  @ApiResponse({ status: 200, description: 'Announcement deleted successfully' })
  async remove(@Param('id') id: string, @Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    await this.announcementsService.remove(+id);
    return { message: 'Announcement deleted successfully' };
  }
}

