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
            // IMPORTANT: Daily report filters by Created_at (when reservation was created) - same as Admin Dashboard
            // This ensures the Daily report resets every day at midnight (12:00 AM), just like Admin Dashboard
            // The report shows all reservations CREATED today (from 00:00:00.000 to 23:59:59.999)
            // At midnight, the date changes and the report automatically shows only new day's data
            
            // Get current date components in local timezone
            const todayYear = now.getFullYear();
            const todayMonth = now.getMonth();
            const todayDay = now.getDate();
            
            // Create start of day in local timezone (00:00:00.000)
            // This is the reset point - each new day starts at 00:00:00.000
            const localStart = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);
            
            // Create end of day in local timezone (23:59:59.999)
            // Using end of day ensures:
            // 1. The report shows all records from the current day until midnight
            // 2. The day only resets at actual midnight (12:00 AM), matching Admin Dashboard behavior
            // 3. All records from the current day are included until the clock hits midnight
            const localEnd = new Date(todayYear, todayMonth, todayDay, 23, 59, 59, 999);
            
            // Use local dates directly - TypeORM will handle timezone conversion for database queries
            // CRITICAL: At midnight, the date changes, so the next query will filter by the new day's date
            // This ensures Daily data resets every day automatically, matching Admin Dashboard behavior
            startDate = localStart;
            endDate = localEnd;
            
            console.log(`[SalesReport Controller] Daily period - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
            console.log(`[SalesReport Controller] Daily period - Local Start: ${startDate.toLocaleString()}, Local End: ${endDate.toLocaleString()}`);
            console.log(`[SalesReport Controller] Daily period - Now: ${now.toISOString()}, Now Local: ${now.toLocaleString()}`);
            console.log(`[SalesReport Controller] Daily period - Resets at midnight, matching Admin Dashboard behavior`);
            break;
          case 'weekly':
            // Weekly: Show the full calendar week (Monday to Sunday) containing the current date
            // If today is December 5, show December 1 (Monday) to December 7 (Sunday)
            // This resets every week on Monday
            const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            // Calculate days to subtract to get to Monday (start of week)
            // If Sunday (0), go back 6 days to get Monday. If Monday (1), go back 0 days. If Tuesday (2), go back 1 day, etc.
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            // Calculate days to add to get to Sunday (end of week)
            // If Sunday (0), add 0 days. If Monday (1), add 6 days. If Tuesday (2), add 5 days, etc.
            const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
            
            // Start of week: Monday at 00:00:00.000
            const mondayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0, 0);
            // End of week: Sunday at 23:59:59.999
            const sundayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSunday, 23, 59, 59, 999);
            
            startDate = mondayDate;
            endDate = sundayDate;
            
            console.log(`[SalesReport Controller] Weekly period - Day of week: ${dayOfWeek} (0=Sun, 1=Mon, ..., 6=Sat)`);
            console.log(`[SalesReport Controller] Weekly period - Days to Monday: ${daysToMonday}, Days to Sunday: ${daysToSunday}`);
            console.log(`[SalesReport Controller] Weekly period - Start (Monday): ${startDate.toISOString()}, End (Sunday): ${endDate.toISOString()}`);
            console.log(`[SalesReport Controller] Weekly period - Resets every Monday, shows full week (Mon-Sun)`);
            break;
          case 'monthly':
            // Monthly: Show complete current month (1st to last day of month)
            // Filters by Reservation_Date, shows all reservations from the 1st to the last day of the month
            // Resets every month on the 1st
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            // Get last day of current month (using month + 1, day 0 = last day of previous month)
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            endDate = lastDayOfMonth;
            
            console.log(`[SalesReport Controller] Monthly period - Current month: ${now.getMonth() + 1}/${now.getFullYear()}`);
            console.log(`[SalesReport Controller] Monthly period - Start (1st of month): ${startDate.toISOString()}, End (last day): ${endDate.toISOString()}`);
            console.log(`[SalesReport Controller] Monthly period - Resets every 1st of month, shows full month range`);
            break;
          case 'quarterly':
            // Quarterly: Show complete current quarter
            // Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
            // Filters by Reservation_Date, shows all reservations from first day to last day of quarter
            // Resets every quarter (Jan 1, Apr 1, Jul 1, Oct 1)
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            const quarterNumber = Math.floor(now.getMonth() / 3) + 1;
            startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
            // Get last day of current quarter (end of 3rd month of quarter)
            const quarterEndMonth = quarterStartMonth + 2;
            const lastDayOfQuarter = new Date(now.getFullYear(), quarterEndMonth + 1, 0, 23, 59, 59, 999);
            endDate = lastDayOfQuarter;
            
            const quarterMonthNames = ['January', 'April', 'July', 'October'];
            const quarterEndMonthNames = ['March', 'June', 'September', 'December'];
            
            console.log(`[SalesReport Controller] Quarterly period - Current quarter: Q${quarterNumber} ${now.getFullYear()}`);
            console.log(`[SalesReport Controller] Quarterly period - Quarter range: ${quarterMonthNames[quarterNumber - 1]} to ${quarterEndMonthNames[quarterNumber - 1]}`);
            console.log(`[SalesReport Controller] Quarterly period - Start (1st of quarter): ${startDate.toISOString()}, End (last day of quarter): ${endDate.toISOString()}`);
            console.log(`[SalesReport Controller] Quarterly period - Resets every quarter start, shows full quarter range`);
            break;
          case 'yearly':
            // Yearly: Show complete current year (January 1 to December 31)
            // Filters by Reservation_Date, shows all reservations from Jan 1 to Dec 31
            // Resets every year on January 1st
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            
            console.log(`[SalesReport Controller] Yearly period - Current year: ${now.getFullYear()}`);
            console.log(`[SalesReport Controller] Yearly period - Start (Jan 1): ${startDate.toISOString()}, End (Dec 31): ${endDate.toISOString()}`);
            console.log(`[SalesReport Controller] Yearly period - Resets every January 1st, shows full year range (Jan 1 - Dec 31)`);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }
      }

      console.log(`[SalesReport Controller] Final date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      // Pass period to service so it knows which date field to filter by
      const periodValue: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 
        (period as any) || 'daily';
      const result = await this.paymentsService.getSalesReport(startDate, endDate, periodValue);
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
      
      // Get sales report result (debug endpoint uses daily period)
      const salesReportResult = await this.paymentsService.getSalesReport(todayStart, todayEnd, 'daily');
      
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
