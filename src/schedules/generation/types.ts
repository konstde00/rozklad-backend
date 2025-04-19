// types.ts

// types.ts

import { DayOfWeek, LessonType } from '@prisma/client';

export type WeeklySchedule = {
  events: WeeklyEvent[];
  fitness?: number;
};

export type WeeklyEvent = {
  title: string;
  dayOfWeek: DayOfWeek;
  /**
   * timeSlot is now the pair index [0..3].
   *    0 => 08:40-10:15
   *    1 => 10:35-12:10
   *    2 => 12:20-13:55
   *    3 => 14:05-15:40
   */
  timeSlot: number;
  groupId: number;
  teacherId: number;
  subjectId: number;
  classroomId: number;
  lessonType: LessonType;
};
