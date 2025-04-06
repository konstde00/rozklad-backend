// fitnessFunction.ts

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
    // If each pair is 2 academic hours, set this to 2.
    // If you prefer 1 “unit”, keep it as 1.
    const hours = 2; // each scheduled pair counts as 2 hours
    const key = `${event.groupId}-${event.subjectId}-${event.lessonType}`;

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
      (ta) => ta.group_id === groupId && ta.subject_id === subjectId,
    );
    if (!assignment) return;

    let requiredHours = 0;
    switch (lessonType) {
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
    // If each pair is 2 academic hours, set this to 2.
    // If you prefer 1 “unit”, keep it as 1.
    const hours = 2;
    const teacherId = event.teacherId;

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

/**
 * Gaps are computed basically on pair indices. If we treat them as
 * 0,1,2,3, then a gap between 0 and 2 is 1 "slot" gap.
 */
function countTeacherGaps(events: WeeklyEvent[]): number {
  let totalGaps = 0;

  const teacherSchedules = new Map<number, Map<DayOfWeek, number[]>>();

  events.forEach((event) => {
    const { teacherId, dayOfWeek, timeSlot } = event; // timeSlot = pair index

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
        // A gap is the difference minus 1
        // e.g. pairs 0..1 => no gap. 0..2 => gap of 1.
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

    if (!groupSchedules.has(groupId)) {
      groupSchedules.set(groupId, new Map());
    }

    const daySchedule = groupSchedules.get(groupId)!;

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
