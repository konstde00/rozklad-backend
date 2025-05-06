import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';  // Import ServeStaticModule
import { join } from 'path';  // Import path to manage file paths
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { GroupsModule } from './groups/groups.module';
import { SemestersModule } from './semesters/semesters.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SchedulesModule } from './schedules/schedules.module';
import { TeachersModule } from './teachers/teachers.module';
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
    TeacherPreferencesModule,

    // Configure ServeStaticModule to serve static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),  // Directory where your HTML file is located
      serveRoot: '/excelparser/upload',  // URL path where the file will be accessible
    }),
  ],
})
export class AppModule {}
