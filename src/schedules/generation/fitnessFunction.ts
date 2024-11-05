
import { WeeklySchedule, WeeklyEvent } from './types';
import { events_day_of_week, lesson_type } from '@prisma/client';
import { DataService } from '../interfaces';

export function calculateFitness(
  schedule: WeeklySchedule,
  data: DataService,
  semesterWeeks: number
): number {
  let fitness = 0;

  // Existing penalties
  const groupConflicts = countGroupConflicts(schedule.events);
  const teacherConflicts = countTeacherConflicts(schedule.events);
  const classroomConflicts = countClassroomConflicts(schedule.events);

  // Penalize conflicts heavily (hard constraints)
  const totalConflicts = groupConflicts + teacherConflicts + classroomConflicts;
  if (totalConflicts > 0) {
    return Number.NEGATIVE_INFINITY; // Invalid schedule
  }

  // Penalty for not meeting hours_per_semester
  const hoursMismatchPenalty = calculateHoursMismatchPenalty(
    schedule.events,
    data,
    semesterWeeks
  );
  fitness -= hoursMismatchPenalty * 100; // Increased multiplier for stronger penalty

  // Additional penalties or rewards can be added here

  return fitness;
}

// Function to calculate penalty for not meeting hours per semester
function calculateHoursMismatchPenalty(
  events: WeeklyEvent[],
  data: DataService,
  semesterWeeks: number
): number {
  let penalty = 0;
  const groupSubjectLessonTypeHours = new Map<string, number>();

  events.forEach((event) => {
    const key = `${event.groupId}-${event.subjectId}-${event.lessonType}`;
    const hours = 1; // Each event is 1 hour

    if (groupSubjectLessonTypeHours.has(key)) {
      groupSubjectLessonTypeHours.set(
        key,
        groupSubjectLessonTypeHours.get(key)! + hours
      );
    } else {
      groupSubjectLessonTypeHours.set(key, hours);
    }
  });

  // Multiply weekly hours by the number of weeks to get total scheduled hours
  groupSubjectLessonTypeHours.forEach((weeklyHours, key) => {
    const totalScheduledHours = weeklyHours * semesterWeeks
    const [groupIdStr, subjectIdStr, lessonTypeStr] = key.split('-');
    const subjectId = BigInt(subjectIdStr);
    const lessonType = lessonTypeStr as lesson_type;

    const subject = data.subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    let requiredHours = 0;
    if (lessonType === 'lecture') {
      requiredHours = subject.lecture_hours_per_semester;
    } else if (lessonType === 'practice') {
      requiredHours = subject.practice_hours_per_semester;
    }

    penalty += Math.abs(totalScheduledHours - requiredHours);
  });

  return penalty;
}

function countGroupConflicts(events: WeeklyEvent[]): number {
  let conflicts = 0;
  const groupSchedule = new Map<string, boolean>();

  events.forEach((event) => {
    const key = `${event.groupId}-${event.dayOfWeek}-${event.timeSlot}`;
    if (groupSchedule.has(key)) {
      conflicts += 1;
    } else {
      groupSchedule.set(key, true);
    }
  });

  return conflicts;
}

function countTeacherConflicts(events: WeeklyEvent[]): number {
  let conflicts = 0;
  const teacherSchedule = new Map<
    bigint,
    Map<events_day_of_week, Set<number>>
  >();

  events.forEach((event) => {
    const { teacherId, dayOfWeek, timeSlot } = event;

    if (!teacherSchedule.has(teacherId)) {
      teacherSchedule.set(teacherId, new Map());
    }

    const daySchedule = teacherSchedule.get(teacherId)!;

    if (!daySchedule.has(dayOfWeek)) {
      daySchedule.set(dayOfWeek, new Set());
    }

    const timeSlots = daySchedule.get(dayOfWeek)!;

    if (timeSlots.has(timeSlot)) {
      conflicts += 1;
    } else {
      timeSlots.add(timeSlot);
    }
  });

  return conflicts;
}

function countClassroomConflicts(events: WeeklyEvent[]): number {
  let conflicts = 0;
  const classroomSchedule = new Map<
    number,
    Map<events_day_of_week, Set<number>>
  >();

  events.forEach((event) => {
    const { classroomId, dayOfWeek, timeSlot } = event;

    if (!classroomSchedule.has(classroomId)) {
      classroomSchedule.set(classroomId, new Map());
    }

    const daySchedule = classroomSchedule.get(classroomId)!;

    if (!daySchedule.has(dayOfWeek)) {
      daySchedule.set(dayOfWeek, new Set());
    }

    const timeSlots = daySchedule.get(dayOfWeek)!;

    if (timeSlots.has(timeSlot)) {
      conflicts += 1;
    } else {
      timeSlots.add(timeSlot);
    }
  });

  return conflicts;
}
