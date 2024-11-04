
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './bigint.interceptor';
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
    = await runGeneticAlgorithm(geneticAlgorithmConfig, data);
  console.log('Best Schedule:', bestSchedule);

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

	const config = new DocumentBuilder()
		.setTitle('API',)
		.setDescription('Description',)
		.setVersion('1.0',)
		.build()
  
	const document = SwaggerModule.createDocument(app, config,)
	SwaggerModule.setup('docs', app, document,)

	app.enableCors({
		origin:      [process.env.FRONTEND_REDIRECT_URL,],
		credentials: true,
	},)
  
  app.useGlobalInterceptors(new BigIntInterceptor());
  await app.listen(3001);
}
bootstrap();
