import { Module } from '@nestjs/common';

import { ClassroomsModule } from './classrooms/classrooms.module';
import { PrismaModule } from './prisma/prisma.module';
import { SemestersModule } from './semesters/ semesters.module';
import { GroupsModule } from './groups/groups.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ClassroomsModule,
    GroupsModule,
    SemestersModule,
    SubjectsModule
  ]
})
export class AppModule {}
