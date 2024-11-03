// fitnessFunction.ts

import {
  schedules as PrismaSchedule,
  events as PrismaEvent,
} from '@prisma/client';

export function calculateFitness(
  schedule: PrismaSchedule & { events: PrismaEvent[] }
): number {
  let fitness = 0;

  // Constraints penalties
  const groupConflicts = countGroupConflicts(schedule.events);
  const scheduleConflicts = countScheduleConflicts(schedule.events);

  // Penalize conflicts
  fitness -= groupConflicts * 10;
  fitness -= scheduleConflicts * 5;

  return fitness;
}

function countGroupConflicts(events: PrismaEvent[]): number {
  // Map to store events per group per day
  const groupEventsMap = new Map<
    bigint,
    Map<string, { startTime: Date; endTime: Date }[]>
  >();

  let conflicts = 0;

  events.forEach((event) => {
    const groupId = event.group_id;
    const dayOfWeek = event.day_of_week; // e.g., 'Monday'
    const startTime = event.start_time;
    const endTime = event.end_time;

    if (!groupEventsMap.has(groupId)) {
      groupEventsMap.set(groupId, new Map());
    }

    const dayEvents = groupEventsMap.get(groupId)!;

    if (!dayEvents.has(dayOfWeek)) {
      dayEvents.set(dayOfWeek, []);
    }

    const eventsList = dayEvents.get(dayOfWeek)!;

    // Check for overlaps with existing events
    for (const existingEvent of eventsList) {
      if (
        isOverlapping(
          startTime.getTime(),
          endTime.getTime(),
          existingEvent.startTime.getTime(),
          existingEvent.endTime.getTime()
        )
      ) {
        conflicts += 1;
        break; // Count each conflict once
      }
    }

    eventsList.push({
      startTime: startTime,
      endTime: endTime,
    });
  });

  return conflicts;
}

function countScheduleConflicts(events: PrismaEvent[]): number {
  // Map to store all events per day
  const allEventsByDay = new Map<
    string,
    { startTime: Date; endTime: Date }[]
  >();

  let conflicts = 0;

  events.forEach((event) => {
    const dayOfWeek = event.day_of_week;
    const startTime = event.start_time;
    const endTime = event.end_time;

    if (!allEventsByDay.has(dayOfWeek)) {
      allEventsByDay.set(dayOfWeek, []);
    }

    const eventsList = allEventsByDay.get(dayOfWeek)!;

    // Check for overlaps with existing events
    for (const existingEvent of eventsList) {
      if (
        isOverlapping(
          startTime.getTime(),
          endTime.getTime(),
          existingEvent.startTime.getTime(),
          existingEvent.endTime.getTime()
        )
      ) {
        conflicts += 1;
        break; // Count each conflict once
      }
    }

    eventsList.push({
      startTime: startTime,
      endTime: endTime,
    });
  });

  return conflicts;
}

// Helper function to check time overlap
function isOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}
