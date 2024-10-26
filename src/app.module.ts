import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { connectionSource } from './config/ormconfig';

import { ConfigModule } from '@nestjs/config';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { PrismaModule } from './prisma/prisma.module';
import { SemestersModule } from './semesters/ semesters.module';

@Module({
  imports: [PrismaModule, ClassroomsModule, SemestersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
