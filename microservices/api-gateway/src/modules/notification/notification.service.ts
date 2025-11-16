import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  private readonly notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

  constructor(private readonly httpService: HttpService) {}

  async findAll(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.notificationServiceUrl}/notifications`, {
          params: { userId }
        })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error al obtener notificaciones del microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async send(sendNotificationDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/notifications/send`, sendNotificationDto)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new HttpException(error.response.data.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Error al enviar notificación en el microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async markAsRead(id: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/notifications/${id}/read`, { userId })
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Notificación no encontrada', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al marcar notificación como leída',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.notificationServiceUrl}/notifications/unread-count`, {
          params: { userId }
        })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error al obtener contador de notificaciones no leídas',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
