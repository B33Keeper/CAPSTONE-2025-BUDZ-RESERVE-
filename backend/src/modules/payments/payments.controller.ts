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
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    try {
      console.log('========================================');
      console.log('[SalesReport Controller] Endpoint called!');
      console.log(`[SalesReport Controller] Period received: ${period}`);
      console.log(`[SalesReport Controller] DateFrom received: ${dateFrom}`);
      console.log(`[SalesReport Controller] DateTo received: ${dateTo}`);
      console.log('========================================');
      
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      // If custom date range is provided, use it instead of period-based dates
      if (dateFrom || dateTo) {
        if (dateFrom) {
          startDate = new Date(dateFrom);
          startDate.setHours(0, 0, 0, 0);
        } else {
          // If only dateTo is provided, start from a reasonable past date (e.g., 1 year ago)
          startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
        }

        if (dateTo) {
          endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // If only dateFrom is provided, end at current time
          endDate = now;
        }

        console.log(`[SalesReport Controller] Using custom date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      } else {
        // Use period-based date calculation
        // Set default period if not provided
        const periodValue: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 
          (period as any) || 'daily';

        switch (periodValue) {
          case 'daily':
            // For daily, get today's date range from start of day to end of day
            // This ensures the report shows all records for the current day until midnight
            // The day will only reset at 12:00 AM (midnight), not before
            // Get current date components in local timezone
            const todayYear = now.getFullYear();
            const todayMonth = now.getMonth();
            const todayDay = now.getDate();
            
            // Create start of day in local timezone (00:00:00.000)
            const localStart = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);
            // Create end of day in local timezone (23:59:59.999)
            // Using end of day instead of current time ensures:
            // 1. The report doesn't become blank before midnight
            // 2. The day only resets at actual midnight (12:00 AM)
            // 3. All records from the current day are included
            const localEnd = new Date(todayYear, todayMonth, todayDay, 23, 59, 59, 999);
            
            // Use local dates directly - TypeORM will handle timezone conversion for database queries
            // Important: Using end of day (23:59:59.999) prevents the report from resetting
            // before midnight, which was causing the "blank report" issue
            startDate = localStart;
            endDate = localEnd;
            
            console.log(`[SalesReport Controller] Daily period - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
            console.log(`[SalesReport Controller] Daily period - Local Start: ${startDate.toLocaleString()}, Local End: ${endDate.toLocaleString()}`);
            console.log(`[SalesReport Controller] Daily period - Now: ${now.toISOString()}, Now Local: ${now.toLocaleString()}`);
            console.log(`[SalesReport Controller] Daily period - Using end of day to prevent early reset`);
            break;
          case 'weekly':
            // Weekly: Show last 7 days including today (today and 6 days before)
            // Full week period from start of first day to end of last day
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
          case 'monthly':
            // Monthly: Show complete current month (1st to last day of month)
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            // Get last day of current month
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            endDate = lastDayOfMonth;
            break;
          case 'quarterly':
            // Quarterly: Show complete current quarter
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
            // Get last day of current quarter (end of 3rd month of quarter)
            const quarterEndMonth = quarterStartMonth + 2;
            const lastDayOfQuarter = new Date(now.getFullYear(), quarterEndMonth + 1, 0, 23, 59, 59, 999);
            endDate = lastDayOfQuarter;
            break;
          case 'yearly':
            // Yearly: Show complete current year (Jan 1 to Dec 31)
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }
      }

      console.log(`[SalesReport Controller] Final date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
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
          notificationCount: schedulerResult.notificationCount || 0,
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
