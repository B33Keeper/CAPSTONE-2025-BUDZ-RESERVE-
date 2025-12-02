import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeeManagementService } from './fee-management.service';
import { CreateFeeManagementDto } from './dto/create-fee-management.dto';
import { UpdateFeeManagementDto } from './dto/update-fee-management.dto';

@ApiTags('fee-management')
@Controller('fee-management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeeManagementController {
  constructor(private readonly feeManagementService: FeeManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new fee management record' })
  @ApiResponse({ status: 201, description: 'Fee management record created successfully' })
  create(@Body() createFeeManagementDto: CreateFeeManagementDto) {
    return this.feeManagementService.create(createFeeManagementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all current fee management records' })
  @ApiResponse({ status: 200, description: 'List of fee management records' })
  findAll() {
    return this.feeManagementService.findAll();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary statistics for current fees' })
  @ApiResponse({ status: 200, description: 'Summary statistics' })
  getSummary() {
    return this.feeManagementService.getSummary();
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get fee management records by date' })
  @ApiResponse({ status: 200, description: 'List of fee management records for the specified date' })
  findByDate(@Query('date') date: string) {
    return this.feeManagementService.findByDate(date);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get all historical fee management records for the current user' })
  @ApiResponse({ status: 200, description: 'List of historical fee management records' })
  findHistory(@Request() req: any) {
    return this.feeManagementService.findHistory(req.user.id);
  }

  @Get('history/by-date')
  @ApiOperation({ summary: 'Get historical fee management records by date for the current user' })
  @ApiResponse({ status: 200, description: 'List of historical fee management records for the specified date' })
  findHistoryByDate(@Query('date') date: string, @Request() req: any) {
    return this.feeManagementService.findHistoryByDate(date, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a fee management record by ID' })
  @ApiResponse({ status: 200, description: 'Fee management record found' })
  @ApiResponse({ status: 404, description: 'Fee management record not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feeManagementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a fee management record' })
  @ApiResponse({ status: 200, description: 'Fee management record updated successfully' })
  @ApiResponse({ status: 404, description: 'Fee management record not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFeeManagementDto: UpdateFeeManagementDto,
  ) {
    return this.feeManagementService.update(id, updateFeeManagementDto);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark a fee management record as paid' })
  @ApiResponse({ status: 200, description: 'Fee management record marked as paid' })
  markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.feeManagementService.update(id, { paymentStatus: 'paid' });
  }

  @Post(':id/mark-unpaid')
  @ApiOperation({ summary: 'Mark a fee management record as unpaid' })
  @ApiResponse({ status: 200, description: 'Fee management record marked as unpaid' })
  markAsUnpaid(@Param('id', ParseIntPipe) id: number) {
    return this.feeManagementService.update(id, { paymentStatus: 'unpaid' });
  }

  @Post('move-to-history')
  @ApiOperation({ summary: 'Manually move all paid records for a date to history' })
  @ApiResponse({ status: 200, description: 'Records moved to history successfully' })
  moveToHistory(@Query('date') date: string) {
    return this.feeManagementService.movePaidRecordsToHistory(date);
  }

  @Post('save-all-to-history')
  @ApiOperation({ summary: 'Move all fee management records for today to history (only if all are paid)' })
  @ApiResponse({ status: 200, description: 'All records moved to history successfully' })
  @ApiResponse({ status: 400, description: 'Cannot save: not all players are marked as paid' })
  saveAllToHistory(@Query('date') date?: string, @Request() req?: any) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.feeManagementService.moveAllToHistoryIfAllPaid(targetDate, req?.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a fee management record' })
  @ApiResponse({ status: 200, description: 'Fee management record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fee management record not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.feeManagementService.remove(id);
  }

  @Delete('today/clear')
  @ApiOperation({ summary: 'Clear all fee management records for today' })
  @ApiResponse({ status: 200, description: 'Today\'s fee management records cleared successfully' })
  clearToday() {
    return this.feeManagementService.clearTodayRecords();
  }
}

