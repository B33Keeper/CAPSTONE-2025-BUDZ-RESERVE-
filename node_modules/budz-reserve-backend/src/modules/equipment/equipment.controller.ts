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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEquipmentDto: UpdateEquipmentDto) {
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
