import { WeeklySchedule, WeeklyEvent } from './types';
import { events_day_of_week, lesson_type } from '@prisma/client';
import { DataService } from '../interfaces';

export function calculateFitness(
  schedule: WeeklySchedule,
  data: DataService,
  semesterWeeks: number
): number {
  let fitness = 0;

  const groupConflicts = countGroupConflicts(schedule.events);
  const teacherConflicts = countTeacherConflicts(schedule.events);

  const totalConflicts = groupConflicts + teacherConflicts;
  if (totalConflicts > 0) {
    return Number.NEGATIVE_INFINITY;
  }

  const hoursMismatchPenalty = calculateHoursMismatchPenalty(
    schedule.events,
    data,
    semesterWeeks
  );
  fitness -= hoursMismatchPenalty * 100;

  const teacherGaps = countTeacherGaps(schedule.events);
  const groupGaps = countGroupGaps(schedule.events);
  const gapPenaltyWeight = 10;
  fitness -= (teacherGaps + groupGaps) * gapPenaltyWeight;

  return fitness;
}

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
    const totalScheduledHours = weeklyHours * semesterWeeks;
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

function countTeacherGaps(events: WeeklyEvent[]): number {
  let totalGaps = 0;

  const teacherSchedules = new Map<bigint, Map<events_day_of_week, number[]>>();

  events.forEach((event) => {
    const { teacherId, dayOfWeek, timeSlot } = event;

    if (!teacherSchedules.has(teacherId)) {
      teacherSchedules.set(teacherId, new Map());
    }

    const daySchedule = teacherSchedules.get(teacherId)!;

    if (!daySchedule.has(dayOfWeek)) {
      daySchedule.set(dayOfWeek, []);
    }

    daySchedule.get(dayOfWeek)!.push(timeSlot);
  });

  teacherSchedules.forEach((daySchedules) => {
    daySchedules.forEach((timeSlots) => {
      const sortedSlots = timeSlots.sort((a, b) => a - b);

      for (let i = 1; i < sortedSlots.length; i++) {
        const gap = sortedSlots[i] - sortedSlots[i - 1] - 1;
        if (gap > 0) {
          totalGaps += gap;
        }
      }
    });
  });

  return totalGaps;
}

function countGroupGaps(events: WeeklyEvent[]): number {
  let totalGaps = 0;

  const groupSchedules = new Map<number, Map<events_day_of_week, number[]>>();

  events.forEach((event) => {
    const { groupId, dayOfWeek, timeSlot } = event;

    if (!groupSchedules.has(groupId as unknown as number)) {
      groupSchedules.set(groupId as unknown as number, new Map());
    }

    const daySchedule = groupSchedules.get(groupId as unknown as number)!;

    if (!daySchedule.has(dayOfWeek)) {
      daySchedule.set(dayOfWeek, []);
    }

    daySchedule.get(dayOfWeek)!.push(timeSlot);
  });

  groupSchedules.forEach((daySchedules) => {
    daySchedules.forEach((timeSlots) => {
      const sortedSlots = timeSlots.sort((a, b) => a - b);

      for (let i = 1; i < sortedSlots.length; i++) {
        const gap = sortedSlots[i] - sortedSlots[i - 1] - 1;
        if (gap > 0) {
          totalGaps += gap;
        }
      }
    });
  });

  return totalGaps;
}
