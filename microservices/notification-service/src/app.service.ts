import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      name: 'Notification Service',
      version: '1.0.0',
      description: 'Microservicio para notificaciones en tiempo real',
      features: ['WebSockets', 'Redis', 'Real-time notifications'],
      endpoints: {
        notifications: '/notifications',
        websocket: '/socket.io/',
      },
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      websockets: 'active',
      redis: 'connected',
    };
  }
}
