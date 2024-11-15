
import { DayOfWeek, LessonType } from '@prisma/client';

export type WeeklySchedule = {
  events: WeeklyEvent[];
  fitness?: number;
};

export type WeeklyEvent = {
  title: string;
  dayOfWeek: DayOfWeek;
  timeSlot: number; // index of TIME_SLOTS
  groupId: bigint;
  teacherId: bigint;
  subjectId: bigint;
  classroomId: number;
  lessonType: LessonType;
};
