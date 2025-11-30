import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationsService } from './reservations.service';
import { ReservationsSchedulerService } from './reservations-scheduler.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationStatus } from './entities/reservation.entity';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly reservationsSchedulerService: ReservationsSchedulerService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid reservation data' })
  create(@Body() createReservationDto: CreateReservationDto, @Request() req: any) {
    return this.reservationsService.create(createReservationDto, req.user.id);
  }

  @Post('from-payment')
  @ApiOperation({ summary: 'Create reservations from payment data' })
  @ApiResponse({ status: 201, description: 'Reservations created successfully from payment' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  createFromPayment(@Body() paymentData: any) {
    return this.reservationsService.createFromPayment(paymentData);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reservations' })
  @ApiResponse({ status: 200, description: 'Reservations retrieved successfully' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Optional pagination - defaults to returning all (backward compatible)
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.reservationsService.findAll(pageNum, limitNum);
  }

  @Get('my-reservations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reservations' })
  @ApiResponse({ status: 200, description: 'User reservations retrieved successfully' })
  findMyReservations(@Request() req: any) {
    return this.reservationsService.findByUser(req.user.id);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get court availability' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  getAvailability(
    @Query('courtId', ParseIntPipe) courtId: number,
    @Query('date') date: string,
  ) {
    return this.reservationsService.getAvailability(courtId, date);
  }

  @Get('equipment-availability')
  @ApiOperation({ summary: 'Get equipment availability by date and time' })
  @ApiResponse({ status: 200, description: 'Equipment availability retrieved successfully' })
  getEquipmentAvailability(
    @Query('date') date: string,
    @Query('startTime') startTime?: string,
    @Query('hours') hours?: string,
  ) {
    const hoursNum = hours ? parseInt(hours, 10) : undefined;
    return this.reservationsService.getEquipmentAvailabilityByDate(date, startTime, hoursNum);
  }

  @Post('check-duplicate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check for duplicate reservation by user' })
  @ApiResponse({ status: 200, description: 'Duplicate check completed' })
  checkDuplicate(
    @Body() checkDto: { courtId: number; date: string; startTime: string; endTime: string },
    @Request() req: any,
  ) {
    // Log user info for debugging
    console.log(`[ReservationsController] checkDuplicate called - User ID: ${req.user.id}, Username: ${req.user.username}, Email: ${req.user.email}`);
    console.log(`[ReservationsController] Checking for: Court ${checkDto.courtId}, Date: ${checkDto.date}, Time: ${checkDto.startTime} - ${checkDto.endTime}`);
    
    return this.reservationsService.checkDuplicateReservation(
      req.user.id,
      checkDto.courtId,
      checkDto.date,
      checkDto.startTime,
      checkDto.endTime,
    );
  }

  @Get('verify/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify reservation details by ID (for debugging duplicate issues)' })
  @ApiResponse({ status: 200, description: 'Reservation details retrieved' })
  async verifyReservation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const reservation = await this.reservationsService.findOne(id);
    const belongsToUser = reservation.User_ID === req.user.id;
    
    return {
      reservation,
      belongsToUser,
      currentUserId: req.user.id,
      reservationUserId: reservation.User_ID,
      isAdminCreated: reservation.Is_Admin_Created,
      status: reservation.Status,
      shouldBlockBooking: belongsToUser && !reservation.Is_Admin_Created && reservation.Status === ReservationStatus.CONFIRMED,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation updated successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateReservationDto: UpdateReservationDto) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel reservation by ID (changes status to CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async cancelReservation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    // Verify reservation belongs to user
    const reservation = await this.reservationsService.findOne(id);
    if (reservation.User_ID !== req.user.id) {
      throw new BadRequestException('You can only cancel your own reservations');
    }
    
    // Update status to CANCELLED instead of deleting
    return this.reservationsService.update(id, { Status: ReservationStatus.CANCELLED });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete reservation by ID (permanently removes from database)' })
  @ApiResponse({ status: 200, description: 'Reservation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.remove(id);
  }

  @Get('check/queueing-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user has access to queueing system' })
  @ApiResponse({ status: 200, description: 'Access check completed' })
  checkQueueingAccess(@Request() req: any) {
    return this.reservationsService.checkQueueingAccess(req.user.id);
  }

  @Get('history/my-reservations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reservation history' })
  @ApiResponse({ status: 200, description: 'User reservation history retrieved successfully' })
  getUserReservationHistory(@Request() req: any) {
    return this.reservationsService.getUserReservationHistory(req.user.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reservation history (admin only)' })
  @ApiResponse({ status: 200, description: 'All reservation history retrieved successfully' })
  getAllReservationHistory() {
    return this.reservationsService.getAllReservationHistory();
  }

  @Get('history/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reservation history by ID' })
  @ApiResponse({ status: 200, description: 'Reservation history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reservation history not found' })
  getReservationHistoryById(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.getReservationHistoryById(id);
  }

  @Post('cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger cleanup to move ended reservations to history' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async triggerCleanup() {
    return this.reservationsSchedulerService.manualCleanup();
  }
}
