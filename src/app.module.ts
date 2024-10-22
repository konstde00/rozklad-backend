import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { connectionSource } from './config/ormconfig';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: undefined,
      useFactory: async () => {
        await connectionSource.initialize();
        return {
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'user',
          password: 'password',
          database: 'db',
          entities: [],
          synchronize: false,
        };
      }
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
