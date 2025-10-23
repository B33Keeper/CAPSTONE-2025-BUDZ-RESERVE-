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
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@ApiTags('courts')
@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new court' })
  @ApiResponse({ status: 201, description: 'Court created successfully' })
  create(@Body() createCourtDto: CreateCourtDto) {
    return this.courtsService.create(createCourtDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courts' })
  @ApiResponse({ status: 200, description: 'Courts retrieved successfully' })
  findAll() {
    return this.courtsService.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available courts' })
  @ApiResponse({ status: 200, description: 'Available courts retrieved successfully' })
  getAvailableCourts() {
    return this.courtsService.getAvailableCourts();
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total court count' })
  @ApiResponse({ status: 200, description: 'Court count retrieved successfully' })
  getCourtCount() {
    return this.courtsService.getCourtCount();
  }

  @Get('available-count')
  @ApiOperation({ summary: 'Get available court count' })
  @ApiResponse({ status: 200, description: 'Available court count retrieved successfully' })
  getAvailableCourtCount() {
    return this.courtsService.getAvailableCourtCount();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get court by ID' })
  @ApiResponse({ status: 200, description: 'Court retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courtsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update court by ID' })
  @ApiResponse({ status: 200, description: 'Court updated successfully' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCourtDto: UpdateCourtDto) {
    return this.courtsService.update(id, updateCourtDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete court by ID' })
  @ApiResponse({ status: 200, description: 'Court deleted successfully' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courtsService.remove(id);
  }
}
