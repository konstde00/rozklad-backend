import { Module } from '@nestjs/common';

import { ClassroomsModule } from './classrooms/classrooms.module';
import { PrismaModule } from './prisma/prisma.module';
import { SemestersModule } from './semesters/semesters.module';
import { GroupsModule } from './groups/groups.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AuthModule } from './auth/auth.module';
import { SchedulesModule } from './schedules/schedules.module';
import { TeachersModule } from './teachers/teachers.module';
import { ConfigModule } from '@nestjs/config';
import { TeachingAssignmentsModule } from './teachingAssignments/teaching-assignments.module';
import { ExcelparserModule } from './excelparser/excelparser.module';
import { TeacherPreferencesModule } from './teacher-preferences/teacher-preferences.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    ClassroomsModule,
    GroupsModule,
    SemestersModule,
    SubjectsModule,
    SchedulesModule,
    TeachersModule,
    TeachingAssignmentsModule,
    ExcelparserModule,
    TeacherPreferencesModule
  ]
})
export class AppModule {}
