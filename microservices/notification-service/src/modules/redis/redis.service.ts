import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  async onModuleInit() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || 'redis123',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    };

    try {
      // Cliente principal para operaciones generales
      this.client = new Redis(redisConfig);
      
      // Cliente para suscripciones
      this.subscriber = new Redis(redisConfig);
      
      // Cliente para publicaciones
      this.publisher = new Redis(redisConfig);

      this.client.on('connect', () => {
        this.logger.log('Conectado a Redis');
      });

      this.client.on('error', (error) => {
        this.logger.error('Error de conexión a Redis:', error);
      });

      await this.client.ping();
      this.logger.log('Redis conectado exitosamente');
    } catch (error) {
      this.logger.error('Error al conectar con Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    if (this.publisher) {
      await this.publisher.quit();
    }
    this.logger.log('Conexiones Redis cerradas');
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  // Métodos de utilidad para notificaciones
  async saveNotification(userId: string, notification: any): Promise<void> {
    const key = `notifications:${userId}`;
    const notificationWithId = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    await this.client.lpush(key, JSON.stringify(notificationWithId));
    
    // Mantener solo las últimas 100 notificaciones por usuario
    await this.client.ltrim(key, 0, 99);
  }

  async getNotifications(userId: string, offset = 0, limit = 20): Promise<any[]> {
    const key = `notifications:${userId}`;
    const notifications = await this.client.lrange(key, offset, offset + limit - 1);
    return notifications.map(notif => JSON.parse(notif));
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    const key = `notifications:${userId}`;
    const notifications = await this.client.lrange(key, 0, -1);
    
    for (let i = 0; i < notifications.length; i++) {
      const notif = JSON.parse(notifications[i]);
      if (notif.id === notificationId) {
        notif.read = true;
        await this.client.lset(key, i, JSON.stringify(notif));
        return true;
      }
    }
    
    return false;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId, 0, 100);
    return notifications.filter(notif => !notif.read).length;
  }

  async publishNotification(channel: string, data: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  async subscribeToChannel(channel: string, callback: (message: string) => void): Promise<void> {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message);
      }
    });
  }

  // Métodos para manejar usuarios conectados
  async addConnectedUser(userId: string, socketId: string): Promise<void> {
    await this.client.hset('connected_users', userId, socketId);
  }

  async removeConnectedUser(userId: string): Promise<void> {
    await this.client.hdel('connected_users', userId);
  }

  async getConnectedUser(userId: string): Promise<string | null> {
    return await this.client.hget('connected_users', userId);
  }

  async getAllConnectedUsers(): Promise<Record<string, string>> {
    return await this.client.hgetall('connected_users');
  }
}
