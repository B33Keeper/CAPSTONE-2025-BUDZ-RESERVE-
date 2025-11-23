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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { EquipmentRentalSchedulerService } from './equipment-rental-scheduler.service';
import { EquipmentService } from '../equipment/equipment.service';
import { EmailReceiptService } from './email-receipt.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly rentalSchedulerService: EquipmentRentalSchedulerService,
    private readonly equipmentService: EquipmentService,
    private readonly emailReceiptService: EmailReceiptService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('sales-report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sales report' })
  @ApiResponse({ status: 200, description: 'Sales report retrieved successfully' })
  async getSalesReport(
    @Query('period') period?: string,
  ) {
    try {
      console.log('========================================');
      console.log('[SalesReport Controller] Endpoint called!');
      console.log(`[SalesReport Controller] Period received: ${period}`);
      console.log('========================================');
      
      // Set default period if not provided
      const periodValue: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 
        (period as any) || 'daily';
      
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      switch (periodValue) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          break;
        case 'quarterly':
          const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      }

      console.log(`[SalesReport Controller] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      const result = await this.paymentsService.getSalesReport(startDate, endDate);
      console.log(`[SalesReport Controller] Found ${result.data.length} records, summary:`, result.summary);
      return result;
    } catch (error) {
      console.error('[SalesReport Controller] ERROR:', error);
      console.error('[SalesReport Controller] Error stack:', error.stack);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.paymentsService.updateStatus(id, status);
  }

  @Get('debug/reservations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug: Check reservation data being fetched' })
  @ApiResponse({ status: 200, description: 'Debug information retrieved successfully' })
  async debugReservations() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      // Get sales report result
      const salesReportResult = await this.paymentsService.getSalesReport(todayStart, todayEnd);
      
      // Get debug data from service
      const debugData = await this.paymentsService.debugReservationsData(todayStart, todayEnd);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        dateRange: {
          todayStart: todayStart.toISOString(),
          todayEnd: todayEnd.toISOString(),
        },
        salesReportResult: {
          recordsFound: salesReportResult.data.length,
          summary: salesReportResult.summary,
        },
        databaseQuery: debugData.summary,
        dateRangeReservations: debugData.dateRangeReservations,
        recentReservations: debugData.allReservations.slice(0, 10),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('debug/equipment-rentals')
  @ApiOperation({ summary: 'Debug: Check equipment availability and expired rentals' })
  @ApiResponse({ status: 200, description: 'Debug information retrieved successfully' })
  async debugEquipmentRentals() {
    try {
      // Get all equipment with availability
      const equipment = await this.equipmentService.findAll();
      
      // Manually check for expired rentals
      const schedulerResult = await this.rentalSchedulerService.manualCheckExpiredRentals();
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        equipment: equipment.map((eq: any) => ({
          id: eq.id,
          name: eq.equipment_name,
          total_stocks: eq.stocks,
          available_stock: eq.available_stock ?? eq.stocks,
          active_rentals: eq.active_rentals ?? 0,
          status: eq.status,
        })),
        scheduler: {
          message: schedulerResult.message || 'Scheduler check completed',
          expiredRentalsFound: schedulerResult.expiredRentalsFound || 0,
          processedCount: schedulerResult.processedCount || 0,
          emailSentCount: schedulerResult.emailSentCount || 0,
          processedItems: schedulerResult.processedItems || [],
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('debug/test-rental-email')
  @ApiOperation({ summary: 'Debug: Test equipment return reminder email' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  async testRentalEmail(@Body() body?: {
    email?: string;
    equipmentName?: string;
    quantity?: number;
  }) {
    try {
      const testEmail = body?.email || 'test@example.com';
      const equipmentName = body?.equipmentName || 'YONEX Arcsaber 7 Play';
      const quantity = body?.quantity || 2;
      const rentalEndTime = new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const result = await this.emailReceiptService.sendEquipmentReturnReminder({
        customerName: 'Test Customer',
        customerEmail: testEmail,
        equipmentName: equipmentName,
        quantity: quantity,
        rentalEndTime: rentalEndTime,
      });

      return {
        success: result,
        message: result 
          ? `Test email sent successfully to ${testEmail}` 
          : 'Failed to send test email',
        email: testEmail,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
