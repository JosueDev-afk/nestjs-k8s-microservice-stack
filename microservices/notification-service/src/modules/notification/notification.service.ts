import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { NotificationsGateway } from '../websocket/notifications.gateway';
import { SendNotificationDto } from './dto/send-notification.dto';
import { INotification } from './interfaces/notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async sendNotification(sendNotificationDto: SendNotificationDto) {
    try {
      const { userId, userIds, broadcast, ...notificationData } = sendNotificationDto;

      if (broadcast) {
        // Enviar a todos los usuarios conectados
        await this.notificationsGateway.broadcastNotification(notificationData);
        return {
          success: true,
          message: 'Notificación broadcast enviada exitosamente',
          type: 'broadcast',
        };
      }

      if (userIds && userIds.length > 0) {
        // Enviar a múltiples usuarios específicos
        const results = await Promise.allSettled(
          userIds.map(async (id) => {
            const notification: INotification = {
              ...notificationData,
              userId: id,
            };
            return this.notificationsGateway.sendNotificationToUser(id, notification);
          }),
        );

        const successful = results.filter((result) => result.status === 'fulfilled').length;
        const failed = results.length - successful;

        return {
          success: true,
          message: `Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`,
          type: 'multiple',
          stats: { successful, failed, total: results.length },
        };
      }

      if (userId) {
        // Enviar a un usuario específico
        const notification: INotification = {
          ...notificationData,
          userId,
        };

        await this.notificationsGateway.sendNotificationToUser(userId, notification);
        
        return {
          success: true,
          message: 'Notificación enviada exitosamente',
          type: 'single',
          userId,
        };
      }

      return {
        success: false,
        message: 'Debe especificar userId, userIds o broadcast=true',
        error: 'INVALID_PARAMETERS',
      };
    } catch (error) {
      this.logger.error('Error al enviar notificación:', error);
      return {
        success: false,
        message: 'Error al enviar notificación',
        error: error.message,
      };
    }
  }

  async getNotifications(userId: string, offset: number = 0, limit: number = 20) {
    try {
      const notifications = await this.redisService.getNotifications(userId, offset, limit);
      const unreadCount = await this.redisService.getUnreadCount(userId);

      return {
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            offset,
            limit,
            total: notifications.length,
          },
        },
      };
    } catch (error) {
      this.logger.error('Error al obtener notificaciones:', error);
      return {
        success: false,
        message: 'Error al obtener notificaciones',
        error: error.message,
      };
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const success = await this.redisService.markNotificationAsRead(userId, notificationId);

      if (success) {
        const unreadCount = await this.redisService.getUnreadCount(userId);
        
        // Notificar al usuario vía WebSocket sobre el cambio
        const socketId = await this.redisService.getConnectedUser(userId);
        if (socketId) {
          this.notificationsGateway.server.to(`user_${userId}`).emit('notification_read', {
            notificationId,
            unreadCount,
          });
        }

        return {
          success: true,
          message: 'Notificación marcada como leída',
          unreadCount,
        };
      }

      return {
        success: false,
        message: 'Notificación no encontrada',
        error: 'NOT_FOUND',
      };
    } catch (error) {
      this.logger.error('Error al marcar notificación como leída:', error);
      return {
        success: false,
        message: 'Error al marcar notificación como leída',
        error: error.message,
      };
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await this.redisService.getUnreadCount(userId);
      return {
        success: true,
        data: {
          userId,
          unreadCount: count,
        },
      };
    } catch (error) {
      this.logger.error('Error al obtener contador de no leídas:', error);
      return {
        success: false,
        message: 'Error al obtener contador de notificaciones no leídas',
        error: error.message,
      };
    }
  }

  async getStats() {
    try {
      const connectedUsers = await this.redisService.getAllConnectedUsers();
      const connectedCount = Object.keys(connectedUsers).length;

      return {
        success: true,
        data: {
          connectedUsers: connectedCount,
          timestamp: new Date().toISOString(),
          service: 'notification-service',
          status: 'active',
        },
      };
    } catch (error) {
      this.logger.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message,
      };
    }
  }

  async broadcast(broadcastDto: Omit<SendNotificationDto, 'userId' | 'userIds'>) {
    try {
      await this.notificationsGateway.broadcastNotification(broadcastDto);
      
      const connectedUsers = await this.redisService.getAllConnectedUsers();
      const connectedCount = Object.keys(connectedUsers).length;

      return {
        success: true,
        message: 'Broadcast enviado exitosamente',
        data: {
          recipientCount: connectedCount,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error en broadcast:', error);
      return {
        success: false,
        message: 'Error al enviar broadcast',
        error: error.message,
      };
    }
  }

  async getConnectedUsers() {
    try {
      const connectedUsers = await this.redisService.getAllConnectedUsers();
      
      return {
        success: true,
        data: {
          connectedUsers: Object.keys(connectedUsers),
          count: Object.keys(connectedUsers).length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error al obtener usuarios conectados:', error);
      return {
        success: false,
        message: 'Error al obtener usuarios conectados',
        error: error.message,
      };
    }
  }
}
