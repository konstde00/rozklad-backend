// scheduleGenerator.ts

import { WeeklyEvent, WeeklySchedule } from './types';
import { PAIR_SLOTS } from '../timeSlots'; // use pairs now
import { DataService } from '../interfaces';
import { DayOfWeek, LessonType } from '@prisma/client';

export function generateRandomWeeklySchedule(data: DataService): WeeklySchedule {
  const events: WeeklyEvent[] = [];
  const scheduleMap = createScheduleMap();

  // Calculate the number of weeks in the semester
  const semesterWeeks = calculateSemesterWeeks(
    data.semesters[0].start_date,
    data.semesters[0].end_date,
  );

  // For each teachingAssignment, we create approximate events
  data.teachingAssignments.forEach((assignment) => {
    const group = data.studentGroups.find((g) => g.id === assignment.group_id);
    if (!group) return;

    const subject = data.subjects.find((s) => s.id === assignment.subject_id);
    if (!subject) return;

    const teacher = data.teachers.find((t) => t.id === assignment.teacher_id);
    if (!teacher) return;

    // We'll consider all lessonTypes
    const lessonTypes: LessonType[] = [];
    if (assignment.lecture_hours_per_semester > 0) lessonTypes.push('lecture');
    if (assignment.practice_hours_per_semester > 0) lessonTypes.push('practice');
    if (assignment.lab_hours_per_semester > 0) lessonTypes.push('lab');
    if (assignment.seminar_hours_per_semester > 0) lessonTypes.push('seminar');

    lessonTypes.forEach((lt) => {
      let requiredHours = 0;
      switch (lt) {
        case 'lecture':
          requiredHours = assignment.lecture_hours_per_semester;
          break;
        case 'practice':
          requiredHours = assignment.practice_hours_per_semester;
          break;
        case 'lab':
          requiredHours = assignment.lab_hours_per_semester;
          break;
        case 'seminar':
          requiredHours = assignment.seminar_hours_per_semester;
          break;
      }

      if (requiredHours === 0) return;

      const totalLessons = Math.ceil(requiredHours / 2);
      const lessonsPerWeek = Math.ceil(totalLessons / semesterWeeks);

      for (let i = 0; i < lessonsPerWeek; i++) {
        // Pick a suitable classroom
        const suitableClassrooms = data.classrooms.filter(
          (c) => c.capacity >= group.students_count,
        );
        if (suitableClassrooms.length === 0) continue;
        const classroom =
          suitableClassrooms[Math.floor(Math.random() * suitableClassrooms.length)];

        // random day_of_week
        const daysOfWeek = Object.values(DayOfWeek).filter(
          (value) => typeof value === 'string',
        ) as DayOfWeek[];
        const day_of_week =
          daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];

        // pick a random pair index 0..3
        const pairIndex = Math.floor(Math.random() * PAIR_SLOTS.length);

        const event: WeeklyEvent = {
          title: subject.name,
          dayOfWeek: day_of_week,
          timeSlot: pairIndex, // store pair index
          groupId: group.id,
          teacherId: teacher.id,
          subjectId: subject.id,
          classroomId: classroom.id,
          lessonType: lt,
        };

        if (!hasConflict(event, scheduleMap)) {
          events.push(event);
          updateScheduleMap(event, scheduleMap);
        } else {
          // attempt alternative
          const alternativeEvent = findAlternativeEvent(event, scheduleMap);
          if (alternativeEvent) {
            events.push(alternativeEvent);
            updateScheduleMap(alternativeEvent, scheduleMap);
          }
        }
      }
    });
  });

  return { events };
}

function createScheduleMap() {
  return {
    teacherSchedule: new Map<string, boolean>(),
    groupSchedule: new Map<string, boolean>(),
    classroomSchedule: new Map<string, boolean>(),
  };
}

/**
 * We treat timeSlot as 0..3.
 * So conflict = same teacher-group-classroom in same dayOfWeek + pairIndex
 */
function hasConflict(event: WeeklyEvent, scheduleMap): boolean {
  const key = `${event.dayOfWeek}-${event.timeSlot}`;
  const teacherKey = `T-${event.teacherId}-${key}`;
  const groupKey = `G-${event.groupId}-${key}`;
  const classroomKey = `C-${event.classroomId}-${key}`;

  if (
    scheduleMap.teacherSchedule.has(teacherKey) ||
    scheduleMap.groupSchedule.has(groupKey) ||
    scheduleMap.classroomSchedule.has(classroomKey)
  ) {
    return true;
  }
  return false;
}

function updateScheduleMap(event: WeeklyEvent, scheduleMap) {
  const key = `${event.dayOfWeek}-${event.timeSlot}`;
  scheduleMap.teacherSchedule.set(`T-${event.teacherId}-${key}`, true);
  scheduleMap.groupSchedule.set(`G-${event.groupId}-${key}`, true);
  scheduleMap.classroomSchedule.set(`C-${event.classroomId}-${key}`, true);
}

export function calculateSemesterWeeks(startDate: Date, endDate: Date): number {
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / msInWeek);
}

function findAlternativeEvent(
  event: WeeklyEvent,
  scheduleMap
): WeeklyEvent | null {
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ] as DayOfWeek[];

  for (const dayOfWeek of daysOfWeek) {
    for (let pairIndex = 0; pairIndex < PAIR_SLOTS.length; pairIndex++) {
      const alt = { ...event, dayOfWeek, timeSlot: pairIndex };
      if (!hasConflict(alt, scheduleMap)) {
        return alt;
      }
    }
  }
  return null;
}
