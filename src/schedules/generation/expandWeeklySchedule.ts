import { WeeklySchedule } from './types';
import { events as PrismaEvent } from '@prisma/client';
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
    Saturday: 6,
    Sunday: 0,
  };

  while (currentDate <= semesterEndDate) {
    const weekDay = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)

    weeklySchedule.events.forEach((event) => {
      const eventDayIndex = dayOfWeekMap[event.dayOfWeek];

      if (weekDay === eventDayIndex) {
        // Find the time slot
        const timeSlot = TIME_SLOTS[event.timeSlot];

        // Set event start and end times
        const startTime = new Date(currentDate);
        const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(currentDate);
        const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
        endTime.setHours(endHour, endMinute, 0, 0);

        const prismaEvent: PrismaEvent = {
          id: BigInt(0), // Or generate a unique ID
          title: event.title,
          day_of_week: event.dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          schedule_id: BigInt(0), // Assign the appropriate schedule ID
          group_id: event.groupId,
          subject_id: event.subjectId,     // Include subject_id
          teacher_id: event.teacherId,     // Include teacher_id
          classroom_id: event.classroomId, // Include classroom_id
          created_at: new Date(),
          updated_at: new Date(),
        };

        events.push(prismaEvent);
      }
    });

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return events;
}
