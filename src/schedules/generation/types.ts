
import { DayOfWeek, LessonType } from '@prisma/client';

export type WeeklySchedule = {
  events: WeeklyEvent[];
  fitness?: number;
};

export type WeeklyEvent = {
  title: string;
  dayOfWeek: DayOfWeek;
  timeSlot: number; // index of TIME_SLOTS
  groupId: number;
  teacherId: number;
  subjectId: number;
  classroomId: number;
  lessonType: LessonType;
};
