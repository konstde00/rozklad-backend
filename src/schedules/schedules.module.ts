
import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, PrismaService],
  imports: [JwtModule.register({})],
})
export class SchedulesModule {}
