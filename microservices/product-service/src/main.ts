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
  
  // Habilitar CORS
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
  
  setupMetrics(app, 'product-service');

  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  console.log(`📦 Product Service ejecutándose en puerto ${port}`);
  console.log(`🍃 Base de datos MongoDB: ${process.env.MONGODB_URI}`);
}

bootstrap();
