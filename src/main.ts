
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectionSource } from './config/ormconfig';

async function bootstrap() {
  try {
    await connectionSource.initialize();
    console.log('Data Source has been initialized!');

    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
    console.log('Application is running on: http://localhost:3000');
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
  }
}
bootstrap();
