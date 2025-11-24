import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { collectDefaultMetrics, Registry } from 'prom-client';

function setupMetrics(app: INestApplication, serviceName: string) {
  const register = new Registry();
  register.setDefaultLabels({ service: serviceName });
  collectDefaultMetrics({ register });

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/metrics', async (_req, res) => {
    httpAdapter.setHeader(res, 'Content-Type', register.contentType);
    httpAdapter.reply(res, await register.metrics(), 200);
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para WebSockets
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  setupMetrics(app, 'notification-service');

  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  console.log(`🔔 Notification Service ejecutándose en puerto ${port}`);
  console.log(`📡 WebSockets disponibles en ws://localhost:${port}`);
  console.log(`🔴 Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
}

bootstrap();
