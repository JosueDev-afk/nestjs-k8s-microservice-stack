import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { INotification } from '../notification/interfaces/notification.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly redisService: RedisService) {}

  async handleConnection(client: Socket) {
    try {
      // Extraer el userId de los headers o query params
      const userId = client.handshake.query.userId as string;
      
      if (!userId) {
        this.logger.warn(`Cliente desconectado: falta userId`);
        client.disconnect();
        return;
      }

      // Registrar el usuario conectado en Redis
      await this.redisService.addConnectedUser(userId, client.id);
      
      // Unir al cliente a una sala personal
      await client.join(`user_${userId}`);
      
      this.logger.log(`Usuario ${userId} conectado con socket ${client.id}`);
      
      // Enviar notificaciones pendientes al usuario recién conectado
      await this.sendPendingNotifications(userId);
      
      // Emitir evento de conexión exitosa
      client.emit('connected', {
        message: 'Conectado al servicio de notificaciones',
        userId,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      this.logger.error('Error en conexión WebSocket:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;
      
      if (userId) {
        // Remover usuario de Redis
        await this.redisService.removeConnectedUser(userId);
        this.logger.log(`Usuario ${userId} desconectado`);
      }
    } catch (error) {
      this.logger.error('Error al desconectar:', error);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    await client.join(data.room);
    client.emit('joined_room', { room: data.room });
    this.logger.log(`Cliente ${client.id} se unió a la sala ${data.room}`);
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    await client.leave(data.room);
    client.emit('left_room', { room: data.room });
    this.logger.log(`Cliente ${client.id} salió de la sala ${data.room}`);
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { offset?: number; limit?: number },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      const { offset = 0, limit = 20 } = data;
      
      const notifications = await this.redisService.getNotifications(userId, offset, limit);
      const unreadCount = await this.redisService.getUnreadCount(userId);
      
      client.emit('notifications_list', {
        notifications,
        unreadCount,
        offset,
        limit,
      });
    } catch (error) {
      this.logger.error('Error al obtener notificaciones:', error);
      client.emit('error', { message: 'Error al obtener notificaciones' });
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      const success = await this.redisService.markNotificationAsRead(userId, data.notificationId);
      
      if (success) {
        const unreadCount = await this.redisService.getUnreadCount(userId);
        client.emit('notification_read', {
          notificationId: data.notificationId,
          unreadCount,
        });
      } else {
        client.emit('error', { message: 'Notificación no encontrada' });
      }
    } catch (error) {
      this.logger.error('Error al marcar como leída:', error);
      client.emit('error', { message: 'Error al marcar notificación como leída' });
    }
  }

  // Método para enviar notificación a un usuario específico
  async sendNotificationToUser(userId: string, notification: INotification) {
    try {
      // Guardar en Redis
      await this.redisService.saveNotification(userId, notification);
      
      // Verificar si el usuario está conectado
      const socketId = await this.redisService.getConnectedUser(userId);
      
      if (socketId) {
        // Enviar notificación en tiempo real
        this.server.to(`user_${userId}`).emit('new_notification', notification);
        
        // Enviar contador actualizado
        const unreadCount = await this.redisService.getUnreadCount(userId);
        this.server.to(`user_${userId}`).emit('unread_count', { count: unreadCount });
        
        this.logger.log(`Notificación enviada a usuario ${userId}`);
      } else {
        this.logger.log(`Usuario ${userId} no conectado, notificación guardada para más tarde`);
      }
    } catch (error) {
      this.logger.error('Error al enviar notificación:', error);
    }
  }

  // Método para broadcast a todos los usuarios conectados
  async broadcastNotification(notification: Omit<INotification, 'userId'>) {
    try {
      const connectedUsers = await this.redisService.getAllConnectedUsers();
      
      for (const userId of Object.keys(connectedUsers)) {
        const userNotification: INotification = {
          ...notification,
          userId,
        };
        
        await this.sendNotificationToUser(userId, userNotification);
      }
      
      this.logger.log(`Broadcast enviado a ${Object.keys(connectedUsers).length} usuarios`);
    } catch (error) {
      this.logger.error('Error en broadcast:', error);
    }
  }

  // Método para enviar notificaciones pendientes cuando un usuario se conecta
  private async sendPendingNotifications(userId: string) {
    try {
      const notifications = await this.redisService.getNotifications(userId, 0, 10);
      const unreadCount = await this.redisService.getUnreadCount(userId);
      
      if (notifications.length > 0) {
        this.server.to(`user_${userId}`).emit('pending_notifications', {
          notifications,
          unreadCount,
        });
      }
    } catch (error) {
      this.logger.error('Error al enviar notificaciones pendientes:', error);
    }
  }
}
