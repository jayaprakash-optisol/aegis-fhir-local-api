import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '@common/filters/all-exceptions-filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { appLogger } from '@common/logger/logger';
import helmet from 'helmet';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: appLogger,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(express.json({ limit: '500kb' }));
  app.use(express.urlencoded({ extended: true, limit: '50kb' }));

  const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') ?? []).map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server to server requests or same origin requests
      if (allowedOrigins.length === 0) return callback(null, true); //dev: allow all origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new ForbiddenException('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Project Management API')
    .setDescription('A comprehensive API for project management with authentication and role-based access control')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Data Scientist', 'Data scientist specific endpoints for accessing FHIR data')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
