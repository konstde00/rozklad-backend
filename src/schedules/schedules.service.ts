// schedules.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleDto } from './dto/schedule.dto';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { getInitialData } from './dataService';
import { runGeneticAlgorithm } from './generation/geneticAlgorithm';
import { expandWeeklyScheduleToSemester } from './generation/expandWeeklySchedule';
import { GeneticAlgorithmConfig } from './interfaces';
import { WeeklySchedule } from './generation/types';
import { DataService } from './interfaces';
import { EventDto } from './dto/event.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all schedules for a given semester ID.
   * @param semesterId - The ID of the semester.
   * @returns An array of ScheduleDto.
   */
  async findBySemesterId(semesterId: string): Promise<ScheduleDto[]> {
    const schedules = await this.prisma.schedule.findMany({
      where: { semester_id: BigInt(semesterId) },
      include: {
        events: {
          include: {
            studentGroup: true,
            teacher: true,
            subject: true,
            classroom: true,
          },
        },
        semester: true,
      },
    });

    if (schedules.length === 0) {
      throw new NotFoundException('No schedules found for this semester');
    }

    return schedules.map((schedule) => this.toScheduleDto(schedule));
  }

  /**
   * Generates a schedule for a given semester using a genetic algorithm.
   * @param generateScheduleDto - Data Transfer Object containing semester ID and optional GA config.
   * @returns The generated ScheduleDto.
   */
  async generateSchedule(
    generateScheduleDto: GenerateScheduleDto,
  ): Promise<ScheduleDto> {
    const semesterId = BigInt(generateScheduleDto.semesterId);

    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    const data: DataService = await getInitialData();

    // Merge default config with any provided in the DTO
    const config: GeneticAlgorithmConfig = {
      populationSize: generateScheduleDto.config?.populationSize || 50,
      crossoverRate: generateScheduleDto.config?.crossoverRate || 0.7,
      mutationRate: generateScheduleDto.config?.mutationRate || 0.1,
      generations: generateScheduleDto.config?.generations || 100,
    };

    const bestWeeklySchedule: WeeklySchedule = await runGeneticAlgorithm(
      config,
      data,
      semesterId,
    );

    console.log('Best Schedule Fitness:', bestWeeklySchedule.fitness);

    const fullSemesterEvents = await expandWeeklyScheduleToSemester(
      bestWeeklySchedule,
      semester.start_date,
      semester.end_date,
    );

    console.log('Total Events Generated:', fullSemesterEvents.length);

    const createdSchedule = await this.prisma.schedule.create({
      data: {
        name: `Schedule for Semester ${semester.id}`,
        semester_id: semesterId,
      },
    });

    await this.createEventsForSchedule(createdSchedule.id, fullSemesterEvents);

    const completeSchedule = await this.prisma.schedule.findUnique({
      where: { id: createdSchedule.id },
      include: {
        events: {
          include: {
            studentGroup: true,
            teacher: true,
            subject: true,
            classroom: true,
          },
        },
        semester: true,
      },
    });

    return this.toScheduleDto(completeSchedule);
  }

  /**
   * Persists events associated with a schedule into the database within a transaction.
   * @param prisma - Prisma transaction client.
   * @param scheduleId - The ID of the schedule.
   * @param events - An array of events to be created.
   */
  private async createEventsForSchedule(scheduleId: bigint, events: any[]) {
    if (events.length === 0) {
      //console.warn(`No events to create for schedule ID ${scheduleId}`);
      return;
    }

    const eventData = events.map((event) => ({
      title: event.title,
      day_of_week: event.day_of_week,
      start_time: event.start_time,
      end_time: event.end_time,
      schedule_id: scheduleId,
      group_id: event.group_id,
      teacher_id: event.teacher_id,
      subject_id: event.subject_id,
      classroom_id: event.classroom_id,
      lesson_type: event.lesson_type,
    }));

    try {
      await this.prisma.event.createMany({
        data: eventData,
        skipDuplicates: true,
      });
      console.log(`Successfully created ${eventData.length} events for schedule ID ${scheduleId}`);
    } catch (error) {
      console.error('Error creating events:', error);
      throw new Error('Failed to create schedule events');
    }
  }

  /**
   * Converts a Prisma schedule entity to a ScheduleDto.
   * @param schedule - The schedule entity from Prisma.
   * @returns A ScheduleDto.
   */
  private toScheduleDto(schedule: Prisma.ScheduleGetPayload<{
    include: {
      events: {
        include: {
          studentGroup: true;
          teacher: true;
          subject: true;
          classroom: true;
        };
      };
      semester: true;
    };
  }>): ScheduleDto {
    return {
      id: schedule.id.toString(),
      name: schedule.name,
      semesterId: schedule.semester_id.toString(),
      semesterTitle: schedule.semester.title,
      events: schedule.events.map((event) => ({
        id: event.id.toString(),
        title: event.title,
        dayOfWeek: event.day_of_week,
        startTime: this.formatTimeWithTimezone(event.start_time),
        endTime: this.formatTimeWithTimezone(event.end_time),
        scheduleId: event.schedule_id.toString(),
        groupName: event.studentGroup.name,
        teacherName: `${event.teacher.first_name} ${event.teacher.last_name}`,
        subjectName: event.subject.name,
        classroomName: event.classroom.name,
        lessonType: event.lesson_type,
      })),
    };
  }

  /**
   * Fetches events within the specified date range (inclusive).
   * @param startDate - The start date in 'YYYY-MM-DD' format.
   * @param endDate - The end date in 'YYYY-MM-DD' format.
   * @returns An array of EventDto.
   */
  async getEventsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<EventDto[]> {
    // Parse dates and ensure they are valid
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }

    // Adjust dates by +3 hours for timezone difference
    const adjustedStart = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const adjustedEnd = new Date(end.getTime() + 3 * 60 * 60 * 1000);

    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          {
            start_time: {
              gte: adjustedStart,
            },
          },
          {
            end_time: {
              lte: adjustedEnd,
            },
          },
        ],
      },
      include: {
        studentGroup: true,
        teacher: true,
        subject: true,
        classroom: true,
      },
    });

    return events.map((event) => ({
      id: event.id.toString(),
      title: event.title,
      dayOfWeek: event.day_of_week,
      date: this.formatDateWithTimezone(event.start_time),
      startTime: this.formatTimeWithTimezone(event.start_time),
      endTime: this.formatTimeWithTimezone(event.end_time),
      scheduleId: event.schedule_id.toString(),
      groupName: event.studentGroup.name,
      teacherName: `${event.teacher.first_name} ${event.teacher.last_name}`,
      subjectName: event.subject.name,
      classroomName: event.classroom.name,
      lessonType: event.lesson_type,
    }));
  }

  /**
   * Formats a Date object to a string in HH:MM format and adds 3 hours for timezone difference.
   * @param date - The Date object to format.
   * @returns A string representing the time in HH:MM format adjusted by +3 hours.
   */
  private formatTimeWithTimezone(date: Date): string {
    // Create a new Date instance to avoid mutating the original date
    const adjustedDate = new Date(date.getTime() + 3 * 60 * 60 * 1000); // Add 3 hours

    const hours = adjustedDate.getHours().toString().padStart(2, '0');
    const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Formats a Date object to a string in YYYY-MM-DD format and adds 3 hours for timezone difference.
   * @param date - The Date object to format.
   * @returns A string representing the date in YYYY-MM-DD format adjusted by +3 hours.
   */
  private formatDateWithTimezone(date: Date): string {
    const adjustedDate = new Date(date.getTime() + 3 * 60 * 60 * 1000); // Add 3 hours

    const year = adjustedDate.getFullYear();
    const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = adjustedDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
