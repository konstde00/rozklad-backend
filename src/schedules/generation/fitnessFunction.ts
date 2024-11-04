
import { WeeklySchedule, WeeklyEvent } from './types';
import { events_day_of_week } from '@prisma/client';
import { DataService } from '../interfaces';

export function calculateFitness(
  schedule: WeeklySchedule,
  data: DataService
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
    data
  );
  fitness -= hoursMismatchPenalty * 50; // Adjust multiplier as needed

  // Additional penalties or rewards can be added here

  return fitness;
}

// Modify conflict counting functions to return boolean
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

// Function to calculate penalty for not meeting hours per semester
function calculateHoursMismatchPenalty(
  events: WeeklyEvent[],
  data: DataService
): number {
  let penalty = 0;
  const groupSubjectHours = new Map<string, number>();

  events.forEach((event) => {
    const key = `${event.groupId}-${event.subjectId}`;
    const hours = 0.75; // Each lesson is 0.75 hours

    if (groupSubjectHours.has(key)) {
      groupSubjectHours.set(key, groupSubjectHours.get(key)! + hours);
    } else {
      groupSubjectHours.set(key, hours);
    }
  });

  // Calculate expected total hours
  groupSubjectHours.forEach((scheduledHours, key) => {
    const [groupIdStr, subjectIdStr] = key.split('-');
    const subjectId = BigInt(subjectIdStr);

    const subject = data.subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const requiredHours = subject.hours_per_semester;

    if (scheduledHours < requiredHours) {
      penalty += requiredHours - scheduledHours;
    } else if (scheduledHours > requiredHours) {
      penalty += scheduledHours - requiredHours;
    }
  });

  return penalty;
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
