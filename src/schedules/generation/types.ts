
import { events_day_of_week } from '@prisma/client';

export type WeeklySchedule = {
  events: WeeklyEvent[];
  fitness?: number;
};

export type WeeklyEvent = {
  title: string;
  dayOfWeek: events_day_of_week;
  timeSlot: number; // index of TIME_SLOTS
  groupId: bigint;
  teacherId: bigint;
  subjectId: bigint;
  classroomId: number;
};