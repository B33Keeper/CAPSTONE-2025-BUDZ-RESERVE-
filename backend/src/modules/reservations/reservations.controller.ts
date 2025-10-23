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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

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
  findAll() {
    return this.reservationsService.findAll();
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.remove(id);
  }
}
