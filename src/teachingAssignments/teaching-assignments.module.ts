

import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { TeachingAssignmentsService } from './teaching-assignments.service';

@Module({
  providers: [TeachingAssignmentsService, PrismaService],
  imports: [JwtModule.register({})],
})
export class TeachingAssignmentsModule {}
