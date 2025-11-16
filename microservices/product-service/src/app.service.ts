import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInfo() {
    return {
      name: 'Product Service',
      version: '1.0.0',
      description: 'Microservicio para gestión de productos',
      database: 'MongoDB',
      endpoints: {
        products: '/products',
        categories: '/categories',
      },
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'product-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    };
  }
}
