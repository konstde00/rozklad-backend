
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import YAML from 'yaml'

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

	const config = new DocumentBuilder()
		.setTitle('API',)
		.setDescription('Description',)
		.setVersion('1.0',)
		.build()

	const document = SwaggerModule.createDocument(app, config,)
  
	// writeFileSync('./openapi.yaml', YAML.stringify(document), 'utf8');
	SwaggerModule.setup('docs', app, document,)

	app.enableCors({
		origin:      [process.env.FRONTEND_REDIRECT_URL,],
		credentials: true,
	},)
  
  await app.listen(3001);
}
bootstrap();
