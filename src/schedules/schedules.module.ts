
import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { GroupsModule } from '../groups/groups.module';
import { TeachingAssignmentsModule } from '../teachingAssignments/teaching-assignments.module';
import { GroupsService } from '../groups/groups.service';
import { TeachingAssignmentsService } from '../teachingAssignments/teaching-assignments.service';

@Module({
  controllers: [
    SchedulesController
  ],
  providers: [
    GroupsService,
    PrismaService,
    SchedulesService,
    TeachingAssignmentsService
  ],
  imports: [
    JwtModule.register({}),
  ],
})
export class SchedulesModule {}
