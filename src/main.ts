import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200', // Змініть відповідно до порту фронтенду
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type',
  });

  // Налаштування для статичних файлів у папці 'public'
  app.useStaticAssets(path.join(__dirname, '..', 'public'));

  // Включаємо валідаційні піди
  app.useGlobalPipes(new ValidationPipe());

  // Налаштування Swagger
  const config = new DocumentBuilder()
    .setTitle('Excel Parser API')
    .setDescription('API для парсингу Excel-файлів')
    .setVersion('1.0')
    .addTag('Excel Parser')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Створюємо Swagger за адресою /docs

  // Запуск додатку
  await app.listen(3001);
}

bootstrap();