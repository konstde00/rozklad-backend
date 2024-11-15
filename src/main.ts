import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { getInitialData } from './schedules/dataService';
import { runGeneticAlgorithm } from './schedules/generation/geneticAlgorithm';
import { GeneticAlgorithmConfig } from './schedules/interfaces';


async function bootstrap() {

  const data = await getInitialData();

  const geneticAlgorithmConfig: GeneticAlgorithmConfig = {
    populationSize: 50,
    crossoverRate: 0.7,
    mutationRate: 0.1,
    generations: 100,
  };

  const bestSchedule
    = await runGeneticAlgorithm(geneticAlgorithmConfig, data, BigInt(1));
  console.log('Best Schedule:', bestSchedule);

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.enableCors({
    origin: 'http://localhost:4200', // Змініть відповідно до порту фронтенду
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type',
  });

  // @ts-ignore
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
