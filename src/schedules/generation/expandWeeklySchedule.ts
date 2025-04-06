// expandWeeklySchedule.ts

import { WeeklySchedule } from './types';
import { Event as PrismaEvent } from '@prisma/client';
import { TIME_SLOTS, PAIR_SLOTS } from '../timeSlots';

export async function expandWeeklyScheduleToSemester(
  weeklySchedule: WeeklySchedule,
  semesterStartDate: Date,
  semesterEndDate: Date
): Promise<PrismaEvent[]> {
  const events: PrismaEvent[] = [];
  const currentDate = new Date(semesterStartDate);
  const dayOfWeekMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };

  while (currentDate <= semesterEndDate) {
    // getDay() in JS: Sunday=0, Monday=1, ...
    // we only care about Monday(1)..Friday(5).
    const jsWeekDay = currentDate.getDay();

    // We only process if it's Monday..Friday
    if (jsWeekDay >= 1 && jsWeekDay <= 5) {
      weeklySchedule.events.forEach((event) => {
        const eventDayIndex = dayOfWeekMap[event.dayOfWeek]; // 1..5

        if (jsWeekDay === eventDayIndex) {
          // event.timeSlot is the pair index 0..3
          const pairSlot = PAIR_SLOTS[event.timeSlot];

          // Prepare the startTime and endTime from the pair definition
          const startTime = new Date(currentDate);
          const [startHour, startMinute] = pairSlot.start.split(':').map(Number);
          startTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date(currentDate);
          const [endHour, endMinute] = pairSlot.end.split(':').map(Number);
          endTime.setHours(endHour, endMinute, 0, 0);

          const prismaEvent: PrismaEvent = {
            id: 0,
            title: event.title,
            day_of_week: event.dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            schedule_id: 0, // Assign the appropriate schedule ID
            group_id: event.groupId,
            subject_id: event.subjectId,
            teacher_id: event.teacherId,
            classroom_id: event.classroomId,
            lesson_type: event.lessonType,
            created_at: new Date(),
            updated_at: new Date(),
          };

          events.push(prismaEvent);
        }
      });
    }

    // Move on to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return events;
}
