
import { WeeklySchedule, WeeklyEvent } from './types';
import { DayOfWeek, LessonType } from '@prisma/client';
import { DataService } from '../interfaces';

export function calculateFitness(
  schedule: WeeklySchedule,
  data: DataService,
  semesterWeeks: number,
): number {
  let fitness = 0;

  const hoursMismatchPenalty = calculateHoursMismatchPenalty(
    schedule.events,
    data,
    semesterWeeks,
  );
  fitness -= hoursMismatchPenalty * 100;

  const teacherGaps = countTeacherGaps(schedule.events);
  const groupGaps = countGroupGaps(schedule.events);
  const gapPenaltyWeight = 10;
  fitness -= (teacherGaps + groupGaps) * gapPenaltyWeight;

  const teacherHoursPenalty = calculateTeacherHoursPenalty(schedule.events, data);
  fitness -= teacherHoursPenalty * 20;

  return fitness;
}

function calculateHoursMismatchPenalty(
  events: WeeklyEvent[],
  data: DataService,
  semesterWeeks: number,
): number {
  let penalty = 0;
  const groupSubjectLessonTypeHours = new Map<string, number>();

  events.forEach((event) => {
    const key = `${event.groupId}-${event.subjectId}-${event.lessonType}`;
    const hours = 1; // Each event is 1 hour

    if (groupSubjectLessonTypeHours.has(key)) {
      groupSubjectLessonTypeHours.set(
        key,
        groupSubjectLessonTypeHours.get(key)! + hours,
      );
    } else {
      groupSubjectLessonTypeHours.set(key, hours);
    }
  });

  // Multiply weekly hours by the number of weeks to get total scheduled hours
  groupSubjectLessonTypeHours.forEach((weeklyHours, key) => {
    const totalScheduledHours = weeklyHours * semesterWeeks;
    const [groupIdStr, subjectIdStr, lessonTypeStr] = key.split('-');
    const groupId = Number(groupIdStr);
    const subjectId = Number(subjectIdStr);
    const lessonType = lessonTypeStr as LessonType;

    const assignment = data.teachingAssignments.find(
      (ta) =>
        ta.group_id === groupId && ta.subject_id === subjectId,
    );

    if (!assignment) return;

    let requiredHours = 0;
    if (lessonType === 'lecture') {
      requiredHours = assignment.lecture_hours_per_semester;
    } else if (lessonType === 'practice') {
      requiredHours = assignment.practice_hours_per_semester;
    } else if (lessonType === 'lab') {
      requiredHours = assignment.lab_hours_per_semester;
    } else if (lessonType === 'seminar') {
      requiredHours = assignment.seminar_hours_per_semester;
    }

    penalty += Math.abs(totalScheduledHours - requiredHours);
  });

  return penalty;
}

function calculateTeacherHoursPenalty(
  events: WeeklyEvent[],
  data: DataService
): number {
  let penalty = 0;
  const teacherWeeklyHours = new Map<number, number>();

  events.forEach((event) => {
    const teacherId = event.teacherId;
    const hours = 1;

    if (teacherWeeklyHours.has(teacherId)) {
      teacherWeeklyHours.set(
        teacherId,
        teacherWeeklyHours.get(teacherId)! + hours
      );
    } else {
      teacherWeeklyHours.set(teacherId, hours);
    }
  });

  teacherWeeklyHours.forEach((scheduledHours, teacherId) => {
    const teacher = data.teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const maxHoursPerWeek = teacher.max_hours_per_week;

    if (scheduledHours > maxHoursPerWeek) {
      // Penalty for exceeding max hours
      penalty += (scheduledHours - maxHoursPerWeek);
    }
  });

  return penalty;
}

function countTeacherGaps(events: WeeklyEvent[]): number {
  let totalGaps = 0;

  const teacherSchedules = new Map<number, Map<DayOfWeek, number[]>>();

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

  const groupSchedules = new Map<number, Map<DayOfWeek, number[]>>();

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
