import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UploadService } from '../upload/upload.service';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  private readonly allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly uploadService: UploadService,
  ) {}

  private validateImage(file: Express.Multer.File) {
    if (!file) {
      return;
    }

    if (!this.allowedImageMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  async create(
    @Body() createEquipmentDto: CreateEquipmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      this.validateImage(file);
      const imagePath = await this.uploadService.uploadFile(file, 'equipments');
      createEquipmentDto.image_path = imagePath;
    }

    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all equipment' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  findAll() {
    return this.equipmentService.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available equipment' })
  @ApiResponse({ status: 200, description: 'Available equipment retrieved successfully' })
  getAvailableEquipment() {
    return this.equipmentService.getAvailableEquipment();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update equipment by ID' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const existingEquipment = await this.equipmentService.findOne(id);

    if (file) {
      this.validateImage(file);

      // Upload new image
      const imagePath = await this.uploadService.uploadFile(file, 'equipments');
      updateEquipmentDto.image_path = imagePath;

      // Delete old image if it was stored locally and not the default asset
      if (
        existingEquipment.image_path &&
        !existingEquipment.image_path.startsWith('http') &&
        !existingEquipment.image_path.startsWith('/assets/')
      ) {
        await this.uploadService.deleteFile(existingEquipment.image_path);
      }
    }

    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete equipment by ID' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentService.remove(id);
  }
}
