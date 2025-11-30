import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async findAll(@Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    return await this.notificationsService.findAll();
  }

  @Get('unread')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all unread notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Unread notifications retrieved successfully' })
  async findUnread(@Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    return await this.notificationsService.findAllUnread();
  }

  @Get('unread/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get count of unread notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    const count = await this.notificationsService.getUnreadCount();
    return { count };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    return await this.notificationsService.markAsRead(parseInt(id));
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read (Admin only)' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    await this.notificationsService.markAllAsRead();
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete notification (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async delete(@Param('id') id: string, @Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    await this.notificationsService.delete(parseInt(id));
    return { message: 'Notification deleted successfully' };
  }
}

