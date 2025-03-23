import { Module } from '@nestjs/common';
import { TeacherPreferencesService } from './teacher-preferences.service';
import { TeacherPreferencesController } from './teacher-preferences.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [TeacherPreferencesService, PrismaService],
  controllers: [TeacherPreferencesController],
})
export class TeacherPreferencesModule {}
