import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationService.sendNotification(sendNotificationDto);
  }

  @Get()
  async getNotifications(
    @Query('userId') userId: string,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 20,
  ) {
    if (!userId) {
      return {
        error: 'El parámetro userId es requerido',
        statusCode: 400,
      };
    }

    return this.notificationService.getNotifications(userId, offset, limit);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') notificationId: string, @Body('userId') userId: string) {
    if (!userId) {
      return {
        error: 'El userId es requerido',
        statusCode: 400,
      };
    }

    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    if (!userId) {
      return {
        error: 'El parámetro userId es requerido',
        statusCode: 400,
      };
    }

    return this.notificationService.getUnreadCount(userId);
  }

  @Get('stats')
  async getStats() {
    return this.notificationService.getStats();
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  async broadcast(@Body() broadcastDto: Omit<SendNotificationDto, 'userId' | 'userIds'>) {
    return this.notificationService.broadcast(broadcastDto);
  }

  @Get('connected-users')
  async getConnectedUsers() {
    return this.notificationService.getConnectedUsers();
  }
}
