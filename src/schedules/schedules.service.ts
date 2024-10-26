import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleDto } from './dto/schedule.dto';
import { Prisma } from '@prisma/client';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySemesterId(semesterId: string): Promise<ScheduleDto[]> {
    const schedules = await this.prisma.schedules.findMany({
      where: { semester_id: BigInt(semesterId) },
      include: {
        events: true,
        semester: true,
      },
    });

    if (schedules.length === 0) {
      throw new NotFoundException('No schedules found for this semester');
    }

    return schedules.map((schedule) => this.toScheduleDto(schedule));
  }

  async generateSchedule(
    generateScheduleDto: GenerateScheduleDto,
  ): Promise<ScheduleDto> {
    const semester = await this.prisma.semesters.findUnique({
      where: { id: BigInt(generateScheduleDto.semesterId) },
    });

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    // TODO: Implement actual schedule generation logic.
    // For demonstration, we'll create a schedule with dummy data.

    const scheduleData: Prisma.schedulesCreateInput = {
      name: `Generated Schedule for ${semester.title}`,
      semester: {
        connect: { id: BigInt(generateScheduleDto.semesterId) },
      },
      events: {
        create: [
          {
            title: 'Sample Event',
            description: 'This is a sample event',
            day_of_week: 'Monday',
            start_time: new Date('1970-01-01T09:00:00Z'),
            end_time: new Date('1970-01-01T10:30:00Z'),
            group_id: BigInt(1),
          },
        ],
      }
    };

    const schedule = await this.prisma.schedules.create({
      data: scheduleData,
      include: {
        events: true,
        semester: true,
      },
    });

    return this.toScheduleDto(schedule);
  }

  private toScheduleDto(schedule: any): ScheduleDto {
    return {
      id: schedule.id.toString(),
      name: schedule.name,
      ownerId: schedule.owner_id ? schedule.owner_id.toString() : null,
      semesterId: schedule.semester_id.toString(),
      semesterTitle: schedule.semesters.title,
      events: schedule.events.map((event) => ({
        id: event.id.toString(),
        title: event.title,
        description: event.description,
        dayOfWeek: event.day_of_week,
        startTime: event.start_time.toISOString().substring(11, 16),
        endTime: event.end_time.toISOString().substring(11, 16),
        scheduleId: event.schedule_id.toString(),
        groupId: event.group_id.toString(),
      })),
    };
  }
}
