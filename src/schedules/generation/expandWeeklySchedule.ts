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

  const dayOfWeekMap: Record<string, number> = {
    Monday:    1,
    Tuesday:   2,
    Wednesday: 3,
    Thursday:  4,
    Friday:    5,
  };

  while (currentDate <= semesterEndDate) {
    const jsWeekDay = currentDate.getDay();          // 0..6, де 1 = Monday

    if (jsWeekDay >= 1 && jsWeekDay <= 5) {
      weeklySchedule.events.forEach(we => {

        if (dayOfWeekMap[we.dayOfWeek] !== jsWeekDay) return;

        const pairSlot = PAIR_SLOTS[we.timeSlot];
        const slotIds  = [pairSlot.startSlotIndex, pairSlot.endSlotIndex];

        slotIds.forEach(slotIdx => {
          const ts = TIME_SLOTS[slotIdx];

          const start = new Date(currentDate);
          const [sh, sm] = ts.start.split(':').map(Number);
          start.setHours(sh, sm, 0, 0);

          const end = new Date(currentDate);
          const [eh, em] = ts.end.split(':').map(Number);
          end.setHours(eh, em, 0, 0);

          events.push({
            id: 0,
            title:        we.title,
            day_of_week:  we.dayOfWeek,
            start_time:   start,
            end_time:     end,
            schedule_id:  0,
            group_id:     we.groupId,
            subject_id:   we.subjectId,
            teacher_id:   we.teacherId,
            classroom_id: we.classroomId,
            lesson_type:  we.lessonType,
            created_at:   new Date(),
            updated_at:   new Date(),
          });
        });
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return events;
}
