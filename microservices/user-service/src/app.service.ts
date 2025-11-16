import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      name: 'User Service',
      version: '1.0.0',
      description: 'Microservicio para gestión de usuarios',
      database: 'PostgreSQL',
      endpoints: {
        users: '/users',
        auth: '/auth',
      },
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    };
  }
}
