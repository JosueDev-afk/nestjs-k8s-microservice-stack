import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'Microservices API Gateway',
      version: '1.0.0',
      description: 'Gateway para acceder a todos los microservicios',
      endpoints: {
        users: '/api/v1/users',
        products: '/api/v1/products',
        notifications: '/api/v1/notifications',
        auth: '/api/v1/auth',
      },
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
