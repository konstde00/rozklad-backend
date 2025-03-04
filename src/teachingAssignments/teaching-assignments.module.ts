

import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { TeachingAssignmentsService } from './teaching-assignments.service';
import { TeachingAssignmentsController } from './teaching-assignments.controller';

@Module({
  controllers: [TeachingAssignmentsController],
  providers: [TeachingAssignmentsService, PrismaService],
  imports: [JwtModule.register({})],
  exports: [TeachingAssignmentsService],
})
export class TeachingAssignmentsModule {}
