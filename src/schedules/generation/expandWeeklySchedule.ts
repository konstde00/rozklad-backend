
// expandWeeklySchedule.ts

import { WeeklySchedule } from './types';
import { Event as PrismaEvent } from '@prisma/client';
import { TIME_SLOTS } from '../timeSlots';

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
    const weekDay = currentDate.getDay(); // 1 (Monday) to 5 (Friday)

    weeklySchedule.events.forEach((event) => {
      const eventDayIndex = dayOfWeekMap[event.dayOfWeek];

      if (weekDay === eventDayIndex) {

        const timeSlot = TIME_SLOTS[event.timeSlot];

        const startTime = new Date(currentDate);
        const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(currentDate);
        const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
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

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return events;
}
