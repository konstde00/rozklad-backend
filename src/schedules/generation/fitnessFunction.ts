// fitnessFunction.ts

import { WeeklySchedule, WeeklyEvent } from './types';
import { DayOfWeek, LessonType, PreferenceType } from '@prisma/client';
import { DataService } from '../interfaces';
import { PAIR_SLOTS } from '../timeSlots';
import { HOURS_PER_EVENT } from '../constants';

export function calculateFitness(
  schedule: WeeklySchedule,
  data: DataService,
  semesterWeeks: number,
): number {
  let fitness = 0;

  // 1. Розриви (gaps)
  const teacherGaps = countTeacherGaps(schedule.events);
  const groupGaps   = countGroupGaps(schedule.events);
  fitness -= (teacherGaps + groupGaps) * 5;

  // 2. Навантаження викладачів
  const teacherHoursPenalty = calculateTeacherHoursPenalty(schedule.events, data);
  fitness -= teacherHoursPenalty * 10;

  // 3. Бажання викладачів
  const preferencePenalty = calculatePreferencePenalty(schedule.events, data);
  fitness -= preferencePenalty * 3;

  // 4. Ефективність використання аудиторій
  const classroomUtilizationPenalty = calculateClassroomUtilizationPenalty(schedule.events, data);
  fitness -= classroomUtilizationPenalty;

  // 5. Недобір та перевибір годин
  const { missingHours, overHours } = calculateCoverage(schedule.events, data, semesterWeeks);
  // Караємо сильніше за недобір годин
  fitness -= missingHours * 250;
  // І слабкіше за надлишок годин
  fitness -= overHours * 300;

  return fitness;
}


function calculateClassroomUtilizationPenalty(
  events: WeeklyEvent[],
  data: DataService
): number {
  let penalty = 0;

  events.forEach(event => {
    const group = data.studentGroups.find(g => g.id === event.groupId);
    const classroom = data.classrooms.find(c => c.id === event.classroomId);

    if (group && classroom) {
      // If classroom is much larger than needed, add penalty
      const utilization = group.students_count / classroom.capacity;
      if (utilization < 0.5) {
        // Penalty for using a classroom that's more than twice the size needed
        penalty += 0.5 - utilization;
      }
    }
  });

  return penalty;
}

export function calculateCoverage(
  events: WeeklyEvent[],
  data: DataService,
  semesterWeeks: number,
): { missingHours: number; overHours: number } {
  const scheduledMap = new Map<string, number>();

  events.forEach(ev => {
    const key = `${ev.groupId}-${ev.subjectId}-${ev.lessonType}`;
    scheduledMap.set(key, (scheduledMap.get(key) ?? 0) + HOURS_PER_EVENT);
  });

  let missingHours = 0;
  let overHours    = 0;

  data.teachingAssignments.forEach(ta => {
    (['lecture','practice','lab','seminar'] as LessonType[]).forEach(lt => {
      const required =
        lt === 'lecture'  ? ta.lecture_hours_per_semester  :
          lt === 'practice' ? ta.practice_hours_per_semester :
            lt === 'lab'      ? ta.lab_hours_per_semester      :
              ta.seminar_hours_per_semester;
      if (!required) return;

      const key = `${ta.group_id}-${ta.subject_id}-${lt}`;
      const scheduledTotal = (scheduledMap.get(key) ?? 0) * semesterWeeks;
      if (scheduledTotal < required) missingHours += (required - scheduledTotal);
      else if (scheduledTotal > required) overHours    += (scheduledTotal - required);
    });
  });

  return { missingHours, overHours };
}


/**
 * For each teacher's preference:
 *   - If PREFERRED_FREE & an event is found => penalty
 *   - If PREFERRED_BUSY & no event is found => penalty
 */
function calculatePreferencePenalty(
  events: WeeklyEvent[],
  data: DataService
): number {
  let penalty = 0;

  // Build an index by teacher -> dayOfWeek -> timeSlot -> isScheduled
  const scheduleMap = new Map<number, Map<DayOfWeek, Set<number>>>();

  // Fill out actual usage with time slots (not pair slots)
  for (const ev of events) {
    if (!scheduleMap.has(ev.teacherId)) {
      scheduleMap.set(ev.teacherId, new Map());
    }
    const dayMap = scheduleMap.get(ev.teacherId)!;
    if (!dayMap.has(ev.dayOfWeek)) {
      dayMap.set(ev.dayOfWeek, new Set());
    }

    // Map pair index to individual time slots
    const pairSlot = PAIR_SLOTS[ev.timeSlot];
    const startSlotIndex = pairSlot.startSlotIndex;
    const endSlotIndex = pairSlot.endSlotIndex;

    // Add both time slots for this pair
    dayMap.get(ev.dayOfWeek)!.add(startSlotIndex);
    dayMap.get(ev.dayOfWeek)!.add(endSlotIndex);
  }

  // Evaluate each preference that is PREFERRED_FREE or PREFERRED_BUSY
  for (const pref of data.teacherPreferences) {
    const teacherId = pref.teacher_id;
    // skip NEUTRAL or REQUIRED_FREE (the latter is handled as hard constraint)
    if (pref.preference === PreferenceType.NEUTRAL || pref.preference === PreferenceType.REQUIRED_FREE) {
      continue;
    }

    const daySet =
      scheduleMap.get(teacherId)?.get(pref.day_of_week) ?? new Set<number>();
    const isScheduledHere = daySet.has(pref.time_slot_index);

    if (pref.preference === PreferenceType.PREFERRED_FREE && isScheduledHere) {
      // Penalize if teacher wanted free but we scheduled a class
      penalty += 2; // or any penalty weight you like
    } else if (pref.preference === PreferenceType.PREFERRED_BUSY && !isScheduledHere) {
      // Penalize if teacher wanted to have a class but none scheduled
      penalty += 1; // or any penalty weight you like
    }
  }

  return penalty;
}

function calculateHoursMismatchPenalty(
  events: WeeklyEvent[],
  data: DataService,
  semesterWeeks: number,
): number {
  let penalty = 0;
  const hoursMap = new Map<string, number>();

  events.forEach(ev => {
    const key = `${ev.groupId}-${ev.subjectId}-${ev.lessonType}`;
    hoursMap.set(key, (hoursMap.get(key) ?? 0) + HOURS_PER_EVENT);
  });

  hoursMap.forEach((weeklyHours, key) => {
    const totalScheduled = weeklyHours * semesterWeeks;
    const [g, s, lt] = key.split('-');
    const ta = data.teachingAssignments.find(
      t => t.group_id === +g && t.subject_id === +s,
    );
    if (!ta) return;

    const required = {
      lecture:  ta.lecture_hours_per_semester,
      practice: ta.practice_hours_per_semester,
      lab:      ta.lab_hours_per_semester,
      seminar:  ta.seminar_hours_per_semester,
    }[lt as LessonType] ?? 0;

    penalty += Math.abs(totalScheduled - required);
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
