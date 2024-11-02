
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './bigint.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
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
