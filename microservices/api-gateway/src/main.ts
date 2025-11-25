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
  
  // Habilitar CORS para permitir conexiones desde diferentes orígenes
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
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');

  await app.init();
  setupMetrics(app, 'api-gateway');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API Gateway ejecutándose en puerto ${port}`);
  console.log(`📊 Documentación disponible en http://localhost:${port}/api/v1`);
}

bootstrap();
