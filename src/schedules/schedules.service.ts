// schedules.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleDto } from './dto/schedule.dto';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { getInitialData } from './dataService';
import { checkHardConstraints, runGeneticAlgorithm } from './generation/geneticAlgorithm';
import { expandWeeklyScheduleToSemester } from './generation/expandWeeklySchedule';
import { GeneticAlgorithmConfig } from './interfaces';
import { WeeklyEvent, WeeklySchedule } from './generation/types';
import { DataService } from './interfaces';
import { EventDto } from './dto/event.dto';
import { DayOfWeek, LessonType, Prisma } from '@prisma/client';
import { PAIR_SLOTS } from './timeSlots';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  WEEKDAYS: DayOfWeek[] = [
    'Monday','Tuesday','Wednesday','Thursday','Friday'
  ];

  /**
   * Fetches all schedules for a given semester ID.
   * @param semesterId - The ID of the semester.
   * @returns An array of ScheduleDto.
   */
  async findBySemesterId(semesterId: string): Promise<ScheduleDto[]> {
    const schedules = await this.prisma.schedule.findMany({
      where: { semester_id: +semesterId },
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
    await this.assignGroupsToTeachingAssignments();

    const semesterId = +generateScheduleDto.semesterId;
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    const data: DataService = await getInitialData();

    const unavailableGroups = data.studentGroups.filter(
      (g) => !data.classrooms.some((c) => c.capacity >= g.students_count),
    );
    if (unavailableGroups.length > 0) {
      const groupNames = unavailableGroups.map((g) => g.name).join(', ');
      throw new BadRequestException(
        `Not enough classrooms for the following groups: ${groupNames}`,
      );
    }

    const config: GeneticAlgorithmConfig = {
      populationSize: generateScheduleDto.config?.populationSize ?? 100,
      crossoverRate: generateScheduleDto.config?.crossoverRate ?? 0.6,
      mutationRate: generateScheduleDto.config?.mutationRate ?? 0.3,
      generations: generateScheduleDto.config?.generations ?? 10,
    };
    const bestWeeklySchedule: WeeklySchedule = await runGeneticAlgorithm(
      config,
      data,
      semesterId,
    );

    this.forceInsertOnePairForEmptyAssignments(bestWeeklySchedule.events, data);

    const fullSemesterEvents = await expandWeeklyScheduleToSemester(
      bestWeeklySchedule,
      semester.start_date,
      semester.end_date,
    );

    /** STEP 5. Зберігаємо у БД */
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
  private async createEventsForSchedule(scheduleId: number, events: any[]) {
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
    const adjustedDate = new Date(date.getTime());

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
    const adjustedDate = new Date(date.getTime());

    const year = adjustedDate.getFullYear();
    const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = adjustedDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Assigns groups to teaching assignments based on course number and speciality.
   * Ensures that each group has only one teaching assignment per subject.
   * Throws an exception if a suitable group cannot be found.
   */
  async assignGroupsToTeachingAssignments(): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const allGroups = await tx.studentGroup.findMany();
      const groupsCache = new Map<
        string,
        { id: number; name: string }[]
      >(); // key = `${spec}-${course}`
      allGroups.forEach((g) => {
        const key = `${g.speciality}-${g.course_number}`;
        if (!groupsCache.has(key)) groupsCache.set(key, []);
        groupsCache.get(key)!.push({ id: g.id, name: g.name });
      });

      const taByGroupSubject = new Map<string, boolean>(); // `${groupId}-${subjectId}`

      const teachingAssignments = await tx.teachingAssignment.findMany();

      // заповнюємо кеш існуючими записами (до зміни)
      teachingAssignments.forEach((ta) =>
        taByGroupSubject.set(`${ta.group_id}-${ta.subject_id}`, true),
      );

      for (const ta of teachingAssignments) {
        const currentGroup = ta.group_id
          ? allGroups.find((g) => g.id === ta.group_id)
          : null;

        const fits =
          currentGroup &&
          currentGroup.speciality === ta.speciality &&
          currentGroup.course_number === ta.course_number;

        if (fits) continue; // усе добре

        const possible = groupsCache.get(
          `${ta.speciality}-${ta.course_number}`,
        );
        if (!possible?.length) {
          throw new NotFoundException(
            `Для speciality=${ta.speciality}, course=${ta.course_number} немає жодної студентської групи`,
          );
        }

        let chosenGroupId: number | null = null;
        for (const g of possible) {
          if (!taByGroupSubject.get(`${g.id}-${ta.subject_id}`)) {
            chosenGroupId = g.id;
            break;
          }
        }

        if (chosenGroupId === null) {
          chosenGroupId = possible[0].id;
        }

        await tx.teachingAssignment.update({
          where: { id: ta.id },
          data: { group_id: chosenGroupId },
        });

        taByGroupSubject.set(`${chosenGroupId}-${ta.subject_id}`, true);
      }
    });
  }

  private forceInsertOnePairForEmptyAssignments(
    events: WeeklyEvent[],
    data: DataService,
  ) {
    // 1) Збираємо ключі group–subject–lessonType, які вже є
    const hasEvent = new Set<string>();
    for (const ev of events) {
      hasEvent.add(`${ev.groupId}-${ev.subjectId}-${ev.lessonType}`);
    }

    // 2) Для кожного TA і кожного потрібного типу додаємо по одній парі
    for (const ta of data.teachingAssignments) {
      // складаємо список lessonType, які треба хоча б раз поставити
      const types: LessonType[] = [];
      if (ta.lecture_hours_per_semester  > 0) types.push('lecture');
      if (ta.practice_hours_per_semester > 0) types.push('practice');
      if (ta.lab_hours_per_semester      > 0) types.push('lab');
      if (ta.seminar_hours_per_semester  > 0) types.push('seminar');

      for (const lessonType of types) {
        const key = `${ta.group_id}-${ta.subject_id}-${lessonType}`;
        if (hasEvent.has(key)) continue;  // вже є

        // Знайдемо group, subject, teacher
        const group   = data.studentGroups.find(g => g.id === ta.group_id);
        const subject = data.subjects.find(s => s.id === ta.subject_id);
        const teacher = data.teachers.find(t => t.id === ta.teacher_id);
        if (!group || !subject || !teacher) continue;

        // 3) Перебираємо дні, пари, аудиторії — шукаємо першу вільну
        outer: for (const day of this.WEEKDAYS) {
          for (let slot = 0; slot < PAIR_SLOTS.length; slot++) {
            for (const room of data.classrooms.filter(c => c.capacity >= group.students_count)) {
              const candidate: WeeklyEvent = {
                title:       subject.name,
                dayOfWeek:   day,
                timeSlot:    slot,
                groupId:     group.id,
                teacherId:   teacher.id,
                subjectId:   subject.id,
                classroomId: room.id,
                lessonType,
              };
              // якщо жодного “hard” конфлікту — додаємо
              if (checkHardConstraints([candidate, ...events], data).length === 0) {
                events.push(candidate);
                hasEvent.add(key);
                break outer;
              }
            }
          }
        }
      }
    }
  }
}

